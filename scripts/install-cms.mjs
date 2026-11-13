import { spawnSync } from "node:child_process";

function run(command, args) {
	const result = spawnSync(command, args, { stdio: "inherit" });
	if (result.status !== 0) throw new Error(`${command} failed`);
}
run("scp", ["cms-auth/server.mjs", "cms-auth/blog-cms.service", "web-vps:/tmp/"]);
run("scp", ["scripts/configure-blog-cms.py", "web-vps:/tmp/"]);
run("ssh", [
	"web-vps",
	[
		"set -e",
		"sudo install -d -m 755 /opt/blog-cms",
		"sudo install -m 644 /tmp/server.mjs /opt/blog-cms/server.mjs",
		"sudo install -m 644 /tmp/blog-cms.service /etc/systemd/system/blog-cms.service",
		"sudo touch /etc/blog-cms.env",
		"sudo chmod 600 /etc/blog-cms.env",
		"sudo systemctl daemon-reload",
		"sudo systemctl enable --now blog-cms",
		"sudo systemctl restart blog-cms",
		"sudo python3 /tmp/configure-blog-cms.py",
	].join("; "),
]);
