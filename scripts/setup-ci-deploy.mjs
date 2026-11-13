import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = "vcorange-chan/personal-blog";
const temporary = mkdtempSync(join(tmpdir(), "blog-ci-"));
function run(command, args, input) {
	const result = spawnSync(command, args, { encoding: "utf8", input, timeout: 60_000 });
	if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
	return result.stdout.trim();
}
try {
	const knownHosts = [];
	for (const target of [
		{ alias: "web-vps", ip: "141.164.39.98", port: 22, secret: "BLOG_SEOUL_SSH_KEY" },
		{ alias: "vps", ip: "149.28.170.226", port: 22022, secret: "BLOG_SYDNEY_SSH_KEY" },
	]) {
		const key = join(temporary, target.alias);
		run("ssh-keygen", [
			"-q",
			"-t",
			"ed25519",
			"-N",
			"",
			"-C",
			`blog-actions-${target.alias}`,
			"-f",
			key,
		]);
		const publicKey = readFileSync(`${key}.pub`, "utf8").trim();
		run("ssh", [
			target.alias,
			`umask 077; mkdir -p ~/.ssh; printf '%s\\n' 'restrict ${publicKey}' >> ~/.ssh/authorized_keys`,
		]);
		const hostKey = run("ssh", [target.alias, "cat /etc/ssh/ssh_host_ed25519_key.pub"])
			.split(" ")
			.slice(0, 2)
			.join(" ");
		knownHosts.push(
			`${target.port === 22 ? target.ip : `[${target.ip}]:${target.port}`} ${hostKey}`,
		);
		run("gh", ["secret", "set", target.secret, "--repo", repo], readFileSync(key));
		console.log(`${target.alias}: dedicated CI key installed; GitHub secret saved.`);
	}
	run(
		"gh",
		["secret", "set", "BLOG_SSH_KNOWN_HOSTS", "--repo", repo],
		`${knownHosts.join("\n")}\n`,
	);
	console.log("Host keys pinned from existing trusted SSH sessions. No private keys printed.");
} finally {
	rmSync(temporary, { recursive: true, force: true });
}
