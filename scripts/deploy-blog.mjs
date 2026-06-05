import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const archive = "blog-dist.tar";
const remoteArchive = "~/blog-dist.tar";
const cspScript = "scripts/apply-caddy-csp-report-only.py";
const remoteCspScript = "/tmp/apply-caddy-csp-report-only.py";
const webHost = process.env.BLOG_WEB_HOST ?? "web-vps";
const sydneyHost = process.env.BLOG_SYDNEY_HOST ?? "vps";
const webRoot = process.env.BLOG_WEB_ROOT ?? "/var/www/cliffordchen.org";
const sydneyRoot = process.env.BLOG_SYDNEY_ROOT ?? "/var/www/cliffordchen.org";

function run(command, args, options = {}) {
	const label = [command, ...args].join(" ");
	console.log(`\n$ ${label}`);
	const prepared = prepareCommand(command, args);
	const result = spawnSync(prepared.command, prepared.args, {
		stdio: "inherit",
		...options,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`Command failed: ${label}`);
	}
}

function runCapture(command, args) {
	const prepared = prepareCommand(command, args);
	const result = spawnSync(prepared.command, prepared.args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	return {
		ok: result.status === 0,
		output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
	};
}

function prepareCommand(command, args) {
	if (process.platform === "win32" && command === "npm") {
		return {
			command: process.env.ComSpec ?? "cmd.exe",
			args: ["/d", "/s", "/c", ["npm", ...args].join(" ")],
		};
	}
	return { command, args };
}

function shellQuote(value) {
	return `'${value.replaceAll("'", "'\\''")}'`;
}

function deployCommand(root, verifyUrl) {
	return [
		"set -e",
		`sudo install -d -o caddy -g caddy ${shellQuote(root)}`,
		`backup=${shellQuote(root)}.before-deploy.$(date -u +%Y%m%d-%H%M%S)`,
		`sudo cp -a ${shellQuote(root)} "$backup"`,
		`sudo find ${shellQuote(root)} -mindepth 1 -maxdepth 1 -exec rm -rf {} +`,
		`sudo tar -xf ${remoteArchive} -C ${shellQuote(root)}`,
		`sudo chown -R caddy:caddy ${shellQuote(root)}`,
		`sudo python3 ${shellQuote(remoteCspScript)}`,
		"sudo caddy fmt --overwrite /etc/caddy/Caddyfile",
		"sudo caddy validate --config /etc/caddy/Caddyfile",
		"sudo systemctl reload caddy",
		`curl -fsSI ${shellQuote(verifyUrl)} >/dev/null`,
		`curl -fsSI ${shellQuote(verifyUrl)} | grep -i '^content-security-policy-report-only:' >/dev/null`,
	].join("; ");
}

function verifyCommand(urls) {
	return urls.map((url) => `curl -fsSI ${shellQuote(url)} >/dev/null`).join("; ");
}

function deployTarget({ host, name, root, verifyUrl, extraVerifyUrls = [] }) {
	const sudoCheck = runCapture("ssh", [host, "sudo -n caddy version >/dev/null"]);
	if (!sudoCheck.ok) {
		throw new Error(
			[
				`${name} (${host}) cannot run passwordless sudo.`,
				"Run this on the VPS first:",
				"sudo visudo -f /etc/sudoers.d/clifford-blog-deploy",
			].join("\n"),
		);
	}

	run("scp", [archive, `${host}:${remoteArchive}`]);
	run("scp", [cspScript, `${host}:${remoteCspScript}`]);
	run("ssh", [host, deployCommand(root, verifyUrl)]);
	if (extraVerifyUrls.length) {
		run("ssh", [host, verifyCommand(extraVerifyUrls)]);
	}
	console.log(`${name} deployment was updated and verified.`);
}

try {
	if (existsSync(archive)) rmSync(archive);

	run("npm", ["run", "build"]);
	run("tar", ["-cf", archive, "-C", "dist", "."]);

	deployTarget({
		extraVerifyUrls: [
			"https://blog.cliffordchen.org/404.html",
			"https://blog.cliffordchen.org/rss.xml",
			"https://blog.cliffordchen.org/posts/lang/french/lecon-1-interactive/",
		],
		host: webHost,
		name: "Seoul blog",
		root: webRoot,
		verifyUrl: "https://blog.cliffordchen.org/",
	});

	deployTarget({
		extraVerifyUrls: [
			"https://cliffordchen.org/404.html",
			"https://cliffordchen.org/rss.xml",
			"https://cliffordchen.org/posts/lang/french/lecon-1-interactive/",
		],
		host: sydneyHost,
		name: "Sydney main site",
		root: sydneyRoot,
		verifyUrl: "https://cliffordchen.org/",
	});

	console.log("\nDeployment script finished.");
	console.log("Seoul and Sydney deployments were updated and verified.");
} finally {
	if (existsSync(archive)) rmSync(archive);
}
