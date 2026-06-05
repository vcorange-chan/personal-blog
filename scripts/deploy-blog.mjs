import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const archive = "blog-dist.tar";
const remoteArchive = "~/blog-dist.tar";
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
		`curl -fsSI ${shellQuote(verifyUrl)} >/dev/null`,
	].join("; ");
}

try {
	if (existsSync(archive)) rmSync(archive);

	run("npm", ["run", "build"]);
	run("tar", ["-cf", archive, "-C", "dist", "."]);

	run("scp", [archive, `${webHost}:${remoteArchive}`]);
	run("ssh", [webHost, deployCommand(webRoot, "https://blog.cliffordchen.org/")]);
	run("ssh", [webHost, "curl -fsSI https://blog.cliffordchen.org/posts/lang/french/lecon-1-interactive/ >/dev/null"]);

	run("scp", [archive, `${sydneyHost}:${remoteArchive}`]);

	const sudoCheck = runCapture("ssh", [sydneyHost, "sudo -n true"]);
	if (sudoCheck.ok) {
		run("ssh", [sydneyHost, deployCommand(sydneyRoot, "https://cliffordchen.org/")]);
	} else {
		console.log("\nSydney VPS requires an interactive sudo password.");
		console.log("The build archive has been uploaded to:");
		console.log(`  ${sydneyHost}:${remoteArchive}`);
		console.log("\nRun this manually on the Sydney VPS:");
		console.log("\nssh vps");
		console.log(deployCommand(sydneyRoot, "https://cliffordchen.org/"));
	}

	console.log("\nDeployment script finished.");
	console.log("Seoul blog deployment was updated and verified.");
	console.log("Sydney deployment is automatic only when passwordless sudo is available.");
} finally {
	if (existsSync(archive)) rmSync(archive);
}
