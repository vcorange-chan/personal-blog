# VPS 工作报告：Web VPS 拆分、博客部署与 TTS 服务

日期：2026-06-05  
本地工作目录：`C:\Users\1\Documents\Documents\Blogs`  
GitHub 仓库：`https://github.com/vcorange-chan/personal-blog`

## 1. 本次目标

本次工作的核心目标是重新整理 VPS 架构：

- 旧 Sydney VPS 继续承担 VPN、订阅服务和主站伪装/真实博客展示。
- 新 Seoul VPS 专门承担公开 Web 服务：
  - `blog.cliffordchen.org`
  - `tts.cliffordchen.org`
  - 未来可能加入 Umami。
- 不影响旧 VPS 上的 VPN 稳定性和安全性。
- 让 HTML 交互式法语文章在博客中以接近完整浏览器页面的方式呈现。

## 2. 最终架构

当前架构：

```text
旧 Sydney VPS
  cliffordchen.org        -> 博客副本
  www.cliffordchen.org    -> 博客副本
  sub.cliffordchen.org    -> 订阅服务，未动
  sing-box / VPN          -> 未动

新 Seoul VPS
  blog.cliffordchen.org   -> Astro 博客副本
  tts.cliffordchen.org    -> TTS proxy
```

这样做的原因：

- 旧 VPN VPS 的 IP 被访问时，仍然展示真实、合法、无害的博客内容。
- TTS proxy 这种公开 API 服务放到新 VPS，避免增加旧 VPN VPS 的额外暴露面。

## 3. 新 Seoul VPS 初始化

新 VPS 信息：

```text
IPv4: 141.164.39.98
IPv6: 2401:c080:1c01:0f67:5400:06ff:fe38:6e4b
Location: Seoul
Plan: vc2-1c-1gb
OS: Ubuntu 22.04.5 LTS
```

### 3.1 SSH 登录检查

使用命令：

```bash
ssh -o BatchMode=yes root@141.164.39.98 "echo ssh-key-ok; hostname; lsb_release -a"
```

目的：

- 确认本机 SSH key 可以登录新 VPS。
- 确认服务器 hostname 和 OS 版本。

结果：

```text
ssh-key-ok
clifford-web
Ubuntu 22.04.5 LTS
```

### 3.2 创建普通用户

使用命令：

```bash
id clifford >/dev/null 2>&1 || useradd -m -s /bin/bash -G sudo clifford
install -d -m 700 -o clifford -g clifford /home/clifford/.ssh
cp /root/.ssh/authorized_keys /home/clifford/.ssh/authorized_keys
chown clifford:clifford /home/clifford/.ssh/authorized_keys
chmod 600 /home/clifford/.ssh/authorized_keys
```

目的：

- 创建普通管理用户 `clifford`。
- 复制 root 的 SSH key，让 `clifford` 可以用 key 登录。
- 后续不再依赖 root 登录。

### 3.3 安装基础工具

使用命令：

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ufw curl ca-certificates gnupg git rsync unzip
```

目的：

- 更新 apt 索引。
- 安装防火墙、下载工具、Git、rsync、解压工具等基础组件。

### 3.4 配置防火墙

使用命令：

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```

目的：

- 默认拒绝入站连接。
- 只开放 SSH、HTTP、HTTPS。
- 不开放 TTS proxy 的内部端口 `8787`。

后续还清理了重复的 `22/tcp` 规则：

```bash
sudo ufw --force delete allow 22/tcp
sudo ufw status verbose
```

最终允许：

```text
OpenSSH
80/tcp
443/tcp
```

### 3.5 安装 Caddy 和 Node.js

先检查 Ubuntu 22.04 默认 Node 版本：

```bash
apt-cache policy nodejs npm caddy
```

发现：

```text
nodejs candidate: 12.22.9
```

问题：

- Node 12 太旧，不适合运行当前 TTS proxy。

解决：

- Caddy 使用官方 apt 仓库。
- Node 使用 NodeSource Node 22 仓库。

使用命令：

```bash
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y caddy nodejs
systemctl enable --now caddy
node -v
npm -v
caddy version
systemctl is-active caddy
```

结果：

```text
Node v22.22.3
npm 10.9.8
Caddy v2.11.4
caddy active
```

### 3.6 增加 swap

使用命令：

```bash
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
free -h
```

目的：

- 新 VPS 只有 1GB RAM。
- 增加 swap 可以降低 Caddy、Node、构建/部署时的内存压力。

## 4. 新 Seoul VPS 部署博客

本地构建：

```powershell
npm run build
```

目的：

- 生成 Astro 静态站点到 `dist/`。

打包：

```powershell
tar -cf blog-dist.tar -C dist .
```

上传到新 VPS：

```powershell
scp blog-dist.tar root@141.164.39.98:/tmp/blog-dist.tar
```

部署到 Web 目录：

```bash
rm -rf /var/www/cliffordchen.org/*
tar -xf /tmp/blog-dist.tar -C /var/www/cliffordchen.org
```

初始 Caddy 预览配置：

```caddyfile
http://141.164.39.98 {
	root * /var/www/cliffordchen.org
	file_server
	encode gzip
}
```

验证命令：

```bash
curl -I http://141.164.39.98/
curl -I http://141.164.39.98/posts/lang/french/lecon-1-interactive/
```

结果：

```text
HTTP/1.1 200 OK
```

## 5. 新 Seoul VPS 部署 TTS proxy

本地打包：

```powershell
git archive --format=tar -o tts-proxy-deploy.tar HEAD tts-proxy
```

上传：

```powershell
scp tts-proxy-deploy.tar root@141.164.39.98:/tmp/tts-proxy-deploy.tar
```

服务器上创建运行用户和目录：

```bash
id tts-worker >/dev/null 2>&1 || useradd --system --home /opt/tts-proxy --shell /usr/sbin/nologin tts-worker
install -d -o tts-worker -g tts-worker /opt/tts-proxy
install -d -o tts-worker -g tts-worker /var/cache/tts-proxy/audio
```

解包、安装依赖、检查语法：

```bash
tar -xf /tmp/tts-proxy-deploy.tar -C /opt/tts-proxy --strip-components=1
cd /opt/tts-proxy
npm ci --omit=dev
npm run check
chown -R tts-worker:tts-worker /opt/tts-proxy /var/cache/tts-proxy
```

环境文件：

```text
/etc/tts-proxy.env
```

说明：

- 真实 `ELEVENLABS_API_KEY` 只写在 VPS 环境文件。
- 不写入 Git。
- 不写入 report。

systemd 服务：

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

启动和验证：

```bash
systemctl daemon-reload
systemctl enable --now tts-proxy
sleep 1
systemctl is-active tts-proxy
curl -sS http://127.0.0.1:8787/health
ss -lntup | grep ':8787'
```

结果：

```text
tts-proxy active
{"ok":true}
127.0.0.1:8787
```

说明：

- TTS proxy 只监听 localhost。
- 公网不能直接访问 `8787`。
- 对外访问只能通过 Caddy 的 `tts.cliffordchen.org` 反代。

## 6. Caddy 正式配置 blog 与 tts

Cloudflare 中新增了：

```text
blog.cliffordchen.org -> 141.164.39.98
tts.cliffordchen.org  -> 141.164.39.98
```

Caddy 配置：

```caddyfile
http://141.164.39.98 {
	root * /var/www/cliffordchen.org
	file_server
	encode gzip
}

blog.cliffordchen.org {
	root * /var/www/cliffordchen.org
	file_server
	encode gzip
}

tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

验证：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
systemctl is-active caddy
systemctl is-active tts-proxy
```

外部验证：

```powershell
curl.exe -I https://blog.cliffordchen.org/
curl.exe -I https://tts.cliffordchen.org/health
```

结果：

```text
https://blog.cliffordchen.org/      200 OK
https://tts.cliffordchen.org/health 200 OK
```

CORS 预检：

```powershell
curl.exe -i -X OPTIONS https://tts.cliffordchen.org/speak `
  -H "Origin: https://cliffordchen.org" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: Content-Type"
```

结果：

```text
204 No Content
Access-Control-Allow-Origin: https://cliffordchen.org
```

也测试了：

```text
Origin: https://blog.cliffordchen.org
```

同样通过。

## 7. SSH 加固

由于 root 密码曾出现在聊天中，本次做了 SSH 加固。

给 `clifford` 配置免密码 sudo：

```bash
echo 'clifford ALL=(ALL) NOPASSWD:ALL' >/etc/sudoers.d/90-clifford-nopasswd
chmod 440 /etc/sudoers.d/90-clifford-nopasswd
visudo -cf /etc/sudoers.d/90-clifford-nopasswd
```

验证：

```bash
ssh -o BatchMode=yes clifford@141.164.39.98 "sudo -n true && echo sudo-ok"
```

禁用 root/password SSH：

```bash
cat >/etc/ssh/sshd_config.d/99-clifford-hardening.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin no
KbdInteractiveAuthentication no
EOF
sshd -t
systemctl reload ssh
```

验证：

```bash
ssh -o BatchMode=yes clifford@141.164.39.98 "echo hardened-login-ok; sudo -n true && echo sudo-ok"
```

结果：

```text
hardened-login-ok
sudo-ok
```

## 8. 本机 SSH alias

读取本机 SSH config：

```powershell
Get-Content -LiteralPath "$env:USERPROFILE\.ssh\config"
```

添加：

```sshconfig
Host web-vps
    HostName 141.164.39.98
    User clifford
    Port 22
    ServerAliveInterval 30
    ServerAliveCountMax 4
```

验证：

```powershell
ssh -o BatchMode=yes web-vps "echo web-vps-ok; hostname; systemctl is-active caddy; systemctl is-active tts-proxy"
```

结果：

```text
web-vps-ok
clifford-web
active
active
```

## 9. 旧 Sydney VPS 主站替换为博客

旧 VPS 检查：

```bash
ssh vps "systemctl is-active caddy; ls -la /var/www/cliffordchen.org | head"
```

发现：

```text
caddy active
/var/www/cliffordchen.org 仍是旧单页伪装站
```

本地构建并上传：

```powershell
npm run build
tar -cf blog-dist.tar -C dist .
scp blog-dist.tar vps:~/blog-dist.tar
```

由于旧 VPS sudo 需要用户密码，最后由用户手动执行：

```bash
sudo cp -a /var/www/cliffordchen.org /var/www/cliffordchen.org.before-blog.$(date -u +%Y%m%d-%H%M%S)
sudo find /var/www/cliffordchen.org -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo tar -xf ~/blog-dist.tar -C /var/www/cliffordchen.org
sudo chown -R caddy:caddy /var/www/cliffordchen.org
curl -I http://127.0.0.1/
curl -I https://cliffordchen.org/
```

结果：

```text
http://127.0.0.1/ -> 308 redirect to HTTPS
https://cliffordchen.org/ -> HTTP/2 200
```

说明：

- `cliffordchen.org` 现在已经是博客。
- 没有修改 `sub.cliffordchen.org`。
- 没有修改 `sing-box`。
- 没有修改 VPN 配置。

## 10. TTS 测试与问题

真实测试 `/speak`：

```powershell
Invoke-WebRequest `
  -Uri 'https://tts.cliffordchen.org/speak' `
  -Method POST `
  -ContentType 'application/json' `
  -Headers @{ Origin = 'https://blog.cliffordchen.org' } `
  -Body '{"text":"Bonjour","voice":"french"}'
```

结果：

```text
paid_plan_required
Free users cannot use library voices via the API.
```

结论：

- `tts.cliffordchen.org`、Caddy、TTS proxy、CORS 都正常。
- ElevenLabs 返回的是套餐/voice 权限问题。
- 页面里听到的默认女声是浏览器 Web Speech API fallback，不是指定 voice id。

## 11. TTS 缓存与限流调整

为了避免后台出现大量 ElevenLabs 请求，TTS proxy 做了保护：

```text
RATE_LIMIT_MAX_REQUESTS=20
DAILY_REQUEST_LIMIT=200
DAILY_CHARACTER_LIMIT=7000
UPSTREAM_FAILURE_CACHE_MS=600000
```

缓存逻辑：

```text
先查 MP3 缓存
  命中 -> 直接返回，不调用 ElevenLabs
  未命中 -> 查失败缓存
  未命中 -> 检查每日请求/字符上限
  通过 -> 调 ElevenLabs
  成功 -> 写入 MP3 缓存
  失败 -> 写入短期失败缓存
```

这样重复请求同一文本和同一 voice id 时，会复用缓存 MP3。

## 12. HTML 交互文章布局调整

问题：

- 法语课程是完整 HTML 交互内容。
- 原先嵌在普通博客正文里，受到 `prose` 窄正文宽度限制，看起来像小框。

改动：

在 content schema 中增加：

```typescript
layout: z.enum(["article", "immersive"]).default("article")
```

法语文章 frontmatter：

```yaml
layout: immersive
```

`BlogPost.astro`：

- 普通文章继续用 `prose` 窄正文。
- `immersive` 文章不套 `prose`。
- `immersive` 文章不显示 TOC。
- iframe 宽度接近浏览器页面。

构建验证：

```powershell
npm run build
```

结果：

```text
16 page(s) built
build Complete
```

部署：

- 已部署到 `blog.cliffordchen.org`。
- 已上传新版包到旧 Sydney VPS，供用户手动更新 `cliffordchen.org`。

## 13. 遇到的困难与解决方案

### 13.1 PowerShell 与 SSH 引号冲突

现象：

- 命令中的 `$(date ...)` 被本地 PowerShell 当成 `Get-Date` 解析。
- JSON 字符串通过 SSH/curl 时被破坏，导致服务返回 400。
- grep 正则中的 `|` 被本地 PowerShell 解析。

解决：

- 尽量改用简单命令。
- 对 JSON 测试改用 PowerShell `Invoke-WebRequest`。
- 复杂服务器命令尽量拆开执行。
- 需要用户 sudo 的步骤，改为上传包后让用户手动执行。

### 13.2 旧 VPS sudo 需要密码

现象：

```text
sudo: a password is required
```

解决：

- 不要求用户把密码发给我。
- 把博客包上传到用户目录。
- 由用户在 SSH 会话里手动执行 sudo 替换主站内容。

### 13.3 Ubuntu 22.04 默认 Node 太旧

现象：

```text
nodejs candidate: 12.22.9
```

解决：

- 使用 NodeSource 安装 Node 22。
- TTS proxy 运行正常。

### 13.4 ElevenLabs voice API 权限问题

现象：

```text
paid_plan_required
Free users cannot use library voices via the API.
```

解决：

- 确认这不是 VPS、Caddy 或 proxy 问题。
- 保留 Web Speech API fallback。
- 增加失败缓存和每日限额，避免持续消耗请求。

### 13.5 TTS 请求数量过高

现象：

- 用户在 ElevenLabs 后台看到两百多次请求。

解决：

- 增加每 IP 分钟限流。
- 增加每日请求和字符上限。
- 成功音频缓存。
- 上游失败短期缓存。

### 13.6 HTML 文章显示过窄

现象：

- 交互式 HTML 在博客中被普通文章布局压成小框。

解决：

- 增加 `layout: immersive`。
- 让交互 HTML 文章脱离普通 `prose` 宽度。
- 保持普通 Markdown 文章不受影响。

## 14. 本次 Git 提交

本次相关提交包括：

```text
5c7b62e Tune TTS usage limits
211fc97 Add new web VPS setup report
1612bfa Support immersive interactive posts
```

说明：

- 没有提交真实 ElevenLabs API key。
- 没有提交 root 密码。
- 没有提交临时 tar 包。

## 15. 当前状态

已完成：

- 新 Seoul VPS 初始化。
- 新 Seoul VPS SSH 加固。
- 新 Seoul VPS 防火墙配置。
- 新 Seoul VPS Caddy/Node 安装。
- `blog.cliffordchen.org` 部署完成。
- `tts.cliffordchen.org` 部署完成。
- 旧 Sydney VPS 主站已变为博客。
- 本机 `web-vps` SSH alias 已添加。
- HTML 交互文章已有 immersive 布局。

仍待处理：

- ElevenLabs 当前 voice id API 权限问题。
- 如果要使用 ElevenLabs 指定音色，需要换可 API 调用的 voice，或升级 ElevenLabs 套餐。
- 旧 Sydney VPS 上的新版 immersive 包如需同步，需要继续按手动 sudo 流程部署。

