# VPS TTS 部署计划：不影响 VPN 的安全路径

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`  
目标服务：`https://tts.cliffordchen.org/speak`

## 1. 结论

可以在现有 VPS 上部署 ElevenLabs TTS proxy，但必须遵守以下原则：

- 不修改 `sing-box` 配置。
- 不修改 SSH 端口。
- 不新增 ufw 对外开放端口。
- 不重启 Caddy，只执行 `reload`。
- TTS 服务只监听 `127.0.0.1`。
- 由 Caddy 通过 `tts.cliffordchen.org` 反向代理到本机端口。
- ElevenLabs API key 只放在 VPS 环境文件中，不进 Git。

这样新增 TTS 不会占用 VPN 使用的 `8443/tcp`、`8443/udp`，也不会影响 `443/udp` 的 HTTP/3 和现有代理服务。

## 2. 基于现有基础设施的部署设计

现有关键端口：

```text
TCP 22022  sshd
TCP 80     Caddy
TCP 443    Caddy HTTPS
UDP 443    Caddy HTTP/3
TCP 8443   sing-box VLESS+Reality
UDP 8443   sing-box Hysteria2
```

TTS 新增：

```text
127.0.0.1:8787  tts-proxy
```

对外访问路径：

```text
Browser
  -> https://tts.cliffordchen.org/speak
  -> Caddy :443
  -> reverse_proxy 127.0.0.1:8787
  -> tts-proxy
  -> ElevenLabs API
```

## 3. 本地代码已做的安全加强

文件：

```text
tts-proxy/src/server.js
```

已调整：

- 默认 `HOST=127.0.0.1`。
- 默认 `PORT=8787`。
- Express 设置 `trust proxy` 为 `loopback`，用于读取 Caddy 转发的客户端 IP。
- `/speak` 增加轻量内存限流：

```text
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

即默认每个 IP 每分钟最多 30 次请求。

## 4. Cloudflare DNS 操作

需要新增一条 DNS 记录：

```text
Type: A
Name: tts
Content: <VPS IPv4>
Proxy status: DNS only
```

建议：

- 使用 `DNS only`。
- 不走 Cloudflare Proxy，避免音频响应和 CORS/debug 行为被中间层影响。
- 不改已有 `cliffordchen.org`、`www`、`sub` 记录。

## 5. VPS 上建议的文件布局

建议放置：

```text
/opt/tts-proxy/
```

建议用户：

```text
tts-worker
```

建议缓存：

```text
/var/cache/tts-proxy/audio
```

建议环境文件：

```text
/etc/tts-proxy.env
```

权限建议：

```text
sudo chown root:tts-worker /etc/tts-proxy.env
sudo chmod 640 /etc/tts-proxy.env
```

## 6. VPS 环境变量

`/etc/tts-proxy.env` 示例：

```text
HOST=127.0.0.1
PORT=8787
ELEVENLABS_API_KEY=<真实 key>
ELEVENLABS_DEFAULT_VOICE_ID=<真实 default voice id>
ELEVENLABS_ENGLISH_VOICE_ID=<真实 english voice id>
ELEVENLABS_FRENCH_VOICE_ID=<真实 voice id>
ELEVENLABS_KOREAN_VOICE_ID=<真实 korean voice id>
ALLOWED_ORIGINS=https://cliffordchen.org
MAX_TEXT_LENGTH=500
CACHE_DIR=/var/cache/tts-proxy/audio
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

注意：

- 不要把真实 key 发到 GitHub。
- 不要把真实 key 写入 `public/`、`src/`、Markdown、HTML。
- 不要把真实 key 写入任何 report。

## 7. systemd 服务建议

文件：

```text
/etc/systemd/system/tts-proxy.service
```

内容：

```ini
[Unit]
Description=Clifford ElevenLabs TTS Proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=tts-worker
Group=tts-worker
WorkingDirectory=/opt/tts-proxy
EnvironmentFile=/etc/tts-proxy.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/cache/tts-proxy

[Install]
WantedBy=multi-user.target
```

说明：

- 服务不以 root 运行。
- 只允许写入 `/var/cache/tts-proxy`。
- 不触碰 Caddy、sing-box、证书目录、订阅目录。

## 8. Caddyfile 新增块

只新增 site block：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

操作原则：

- 只追加，不改已有站点块。
- 先执行：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

- 再执行：

```bash
sudo systemctl reload caddy
```

不要执行：

```bash
sudo systemctl restart caddy
```

原因：

- Caddy 当前还承担主站、订阅服务、证书管理。
- reload 是热加载，风险更低。

## 9. 验收检查

### 9.1 VPS 本机检查

```bash
curl http://127.0.0.1:8787/health
```

期望：

```json
{"ok":true}
```

### 9.2 端口检查

```bash
ss -lntup | grep 8787
```

期望看到：

```text
127.0.0.1:8787
```

不应该看到：

```text
0.0.0.0:8787
```

### 9.3 Caddy 反代检查

```bash
curl https://tts.cliffordchen.org/health
```

期望：

```json
{"ok":true}
```

### 9.4 VPN 不受影响检查

只读检查：

```bash
systemctl is-active sing-box
systemctl is-active caddy
```

期望：

```text
active
active
```

不做：

- 不 restart sing-box。
- 不编辑 `/etc/sing-box/config.json`。
- 不改 ufw。

## 10. 你需要准备什么

为了继续真实部署，需要你提供或手动完成：

1. Cloudflare DNS 面板中新增 `tts.cliffordchen.org` 的 A 记录。
2. ElevenLabs API key。
3. ElevenLabs French voice id。
4. 确认本机 `ssh vps` 可以登录 VPS。

如果你希望我代执行 VPS 命令，我需要通过 `ssh vps` 操作。执行前我会逐条说明命令用途，并且不会修改 `sing-box` 或 ufw。

## 11. 当前建议

建议按这个顺序执行：

1. 先把本地安全加强 commit 并 push。
2. 你在 Cloudflare 添加 `tts` DNS 记录。
3. 我通过 SSH 在 VPS 上创建 `tts-worker`、部署 `/opt/tts-proxy`、配置 systemd。
4. 你把真实 ElevenLabs key 和 voice id 粘贴到 VPS 环境文件，或由你自己手动创建该文件。
5. 我追加 Caddy site block，执行 `caddy validate`，再 `systemctl reload caddy`。
6. 验证 `/health` 和 `/speak`。
7. 验证 VPN 服务仍为 active。
