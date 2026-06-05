# 安全审查报告：VPS、博客代码与 TTS 架构

日期：2026-06-05  
范围：本地博客仓库、TTS proxy、新 Seoul Web VPS、旧 Sydney VPN VPS  
审查方式：只读检查为主，没有修改 VPS 配置  

## 1. 总体结论

整体架构方向是合理的：

- 旧 Sydney VPS 继续保留真实博客和 VPN/订阅服务。
- 新 Seoul VPS 承载公开 Web 服务：`blog.cliffordchen.org` 与 `tts.cliffordchen.org`。
- TTS proxy 只监听 `127.0.0.1:8787`，不直接暴露公网端口。
- ElevenLabs API key 没有进入 Git 仓库。
- 本地依赖审计没有发现已知漏洞。

但从攻击者角度看，当前仍有几个需要处理的安全隐患：

1. **高优先级：新 Seoul VPS 的 SSH 密码登录仍实际生效。**
2. **中高优先级：旧 Sydney VPS 上残留 `tts.cliffordchen.org` Caddy block 和 TTS proxy 进程。**
3. **中优先级：TTS endpoint 只有 CORS 和限流，没有真正的调用鉴权。**
4. **中优先级：主站和 blog 缺少基础安全响应头。**
5. **中低优先级：TTS 缓存没有磁盘上限/清理策略，存在长期磁盘增长风险。**
6. **中低优先级：交互 HTML 使用大量 inline event handler，不适合未来承载不可信内容。**

## 2. 我检查了哪里

### 2.1 本地 Git 和敏感信息

命令：

```powershell
git status --short
git remote -v
git log --oneline -5
```

目的：

- 确认当前仓库状态。
- 确认远端仓库位置。
- 确认最近提交。

命令：

```powershell
rg "sk_|ELEVENLABS_API_KEY=.*[A-Za-z0-9]|<voice_id>|Password:|Password\s*=|BEGIN (RSA|OPENSSH|PRIVATE) KEY|xi-api-key" . --glob '!node_modules/**' --glob '!dist/**' --glob '!\.git/**'
```

目的：

- 搜索疑似 ElevenLabs API key。
- 搜索 voice id。
- 搜索 root 密码或私钥。
- 搜索服务端 API key 请求头。

结果：

- 没有发现真实 API key。
- 没有发现私钥。
- 没有发现 root 密码。
- `xi-api-key` 只在 `tts-proxy/src/server.js` 中作为服务端请求 ElevenLabs 的 header 名出现。
- 文档中只出现占位符或检查命令。

### 2.2 npm 依赖漏洞

命令：

```powershell
npm audit --omit=dev
```

位置：

```text
C:\Users\1\Documents\Documents\Blogs
```

命令：

```powershell
npm audit --omit=dev
```

位置：

```text
C:\Users\1\Documents\Documents\Blogs\tts-proxy
```

目的：

- 检查 Astro 博客依赖和 TTS proxy 依赖是否有 npm 已知漏洞。

结果：

```text
found 0 vulnerabilities
```

### 2.3 构建验证

命令：

```powershell
npm run build
```

目的：

- 确认当前代码仍能正常生成静态站点。
- 避免安全修改/布局修改后存在构建破损。

结果：

```text
16 page(s) built
build Complete
```

### 2.4 TTS proxy 代码审查

检查文件：

```text
tts-proxy/src/server.js
```

重点查看：

- `HOST=127.0.0.1`
- CORS 白名单
- 请求体大小限制
- 文本长度限制
- 每 IP 限流
- 每日上游请求/字符上限
- MP3 缓存逻辑
- 上游失败缓存逻辑
- systemd hardening

结论：

- 缓存顺序正确：先查 MP3 缓存，命中后不调用 ElevenLabs。
- TTS proxy 不直接监听公网。
- 有基础限流和每日额度保护。
- 但 CORS 不是鉴权，攻击者仍可用非浏览器客户端直接 POST。

### 2.5 交互 HTML 审查

检查文件：

```text
public/interactive/lecon-1.html
```

命令：

```powershell
Select-String -Path public\interactive\lecon-1.html -Pattern "fetch|TTS_ENDPOINT|speechSynthesis|innerHTML|onclick|script|iframe|http" -Context 0,2
```

目的：

- 查找外部请求。
- 查找 inline script / inline event handler。
- 查找 `innerHTML`。
- 查找 fallback 语音逻辑。

发现：

- TTS endpoint 固定为 `https://tts.cliffordchen.org/speak`。
- 大量按钮使用 `onclick="speak(...)"`。
- 状态栏使用 `innerHTML` 写入固定状态文本。
- 当前文本是我们自己的静态内容，因此风险可控。
- 如果未来 HTML 内容来自用户输入、AI 生成或外部数据，inline handler 和 `innerHTML` 会增加 XSS 风险。

### 2.6 新 Seoul VPS 安全检查

命令：

```bash
ssh web-vps "id; systemctl is-active caddy; systemctl is-active tts-proxy"
```

目的：

- 确认登录用户。
- 确认 Caddy 和 TTS proxy 状态。

命令：

```bash
ssh web-vps "sudo ufw status verbose"
```

目的：

- 检查防火墙。

结果：

```text
Default: deny incoming, allow outgoing
OpenSSH allowed
80/tcp allowed
443/tcp allowed
```

命令：

```bash
ssh web-vps "sudo grep -RniE '^(PasswordAuthentication|PermitRootLogin|KbdInteractiveAuthentication)' /etc/ssh/sshd_config /etc/ssh/sshd_config.d 2>/dev/null"
```

目的：

- 检查 SSH 配置文件中密码登录、root 登录相关设置。

命令：

```bash
ssh web-vps "sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'"
```

目的：

- 查看 sshd 实际生效配置，而不是只看文件文本。

结果：

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication yes
kbdinteractiveauthentication no
```

重要发现：

- root 登录已禁用。
- 键盘交互登录已禁用。
- 但密码登录仍实际生效。

### 2.7 新 Seoul VPS Caddy 与监听端口

命令：

```bash
ssh web-vps "sudo sed -n '1,200p' /etc/caddy/Caddyfile"
```

目的：

- 检查 Caddy 站点配置。

结果：

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

命令：

```bash
ssh web-vps "sudo ss -lntup | sed -n '1,80p'"
```

目的：

- 检查公网监听端口。

结果：

```text
*:22       sshd
*:80       caddy
*:443      caddy
127.0.0.1:8787 node
127.0.0.1:2019 caddy admin
```

结论：

- TTS proxy 没有公网监听，正确。
- Caddy admin 只在 localhost，正确。
- SSH 端口公网开放，正常但需要禁用密码登录。

### 2.8 新 Seoul VPS systemd 服务

命令：

```bash
ssh web-vps "systemctl cat tts-proxy"
```

目的：

- 检查 TTS proxy 是否以独立低权限用户运行。
- 检查 systemd sandbox 设置。

结果要点：

```ini
User=tts-worker
Group=tts-worker
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/cache/tts-proxy
```

结论：

- 不是 root 运行。
- 有基础 systemd hardening。
- 写权限限制在缓存目录，方向正确。

### 2.9 旧 Sydney VPS 检查

命令：

```bash
ssh vps "systemctl is-active caddy; systemctl is-active sing-box"
```

结果：

```text
caddy active
sing-box active
```

命令：

```bash
ssh vps "sed -n '1,220p' /etc/caddy/Caddyfile"
```

结果中发现：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

命令：

```bash
ssh vps "ss -lntup | sed -n '1,100p'"
```

结果中发现：

```text
127.0.0.1:8787 node
*:8443 sing-box
*:443 caddy
*:80 caddy
```

重要发现：

- 旧 Sydney VPS 仍有 TTS proxy 进程。
- 旧 Sydney VPS Caddyfile 仍有 `tts.cliffordchen.org` block。
- 虽然 DNS 现在指向新 Seoul VPS，但旧配置仍是残留入口。

### 2.10 HTTP 响应头

命令：

```powershell
curl.exe -I https://cliffordchen.org/
curl.exe -I https://blog.cliffordchen.org/
curl.exe -I https://tts.cliffordchen.org/health
curl.exe -I https://sub.cliffordchen.org/
```

结果：

- `sub.cliffordchen.org` 有：

```text
Strict-Transport-Security
X-Content-Type-Options
X-Frame-Options
```

- `cliffordchen.org` 和 `blog.cliffordchen.org` 缺少这些基础安全头。
- `tts.cliffordchen.org/health` 返回 200，并暴露 `Access-Control-Allow-*` 基础头。

### 2.11 DNS 解析方向

命令：

```bash
getent hosts cliffordchen.org
getent hosts blog.cliffordchen.org
getent hosts tts.cliffordchen.org
getent hosts sub.cliffordchen.org
```

结果：

```text
cliffordchen.org      -> 旧 Sydney VPS IPv6 / IPv4
blog.cliffordchen.org -> 新 Seoul VPS
tts.cliffordchen.org  -> 新 Seoul VPS
sub.cliffordchen.org  -> Cloudflare
```

结论：

- 当前 DNS 方向符合我们设计。
- `tts` 已指向新 VPS。

## 3. 主要安全发现

### F1 高优先级：新 Seoul VPS 密码登录仍实际生效

证据：

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
```

输出：

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication yes
kbdinteractiveauthentication no
```

风险：

- root 登录虽然已禁用，但 `PasswordAuthentication yes` 仍允许对普通用户尝试密码登录。
- `clifford` 用户有 sudo 权限，如果账户密码弱或泄露，风险很高。
- VPS 的 SSH 端口公开在公网，长期会被扫描。

可能原因：

- `/etc/ssh/sshd_config.d/50-cloud-init.conf` 中有：

```text
PasswordAuthentication yes
```

- 我们的 `99-clifford-hardening.conf` 没有最终覆盖实际生效值。

建议修复：

```bash
ssh web-vps
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
sudo systemctl reload ssh
```

修复后期望：

```text
passwordauthentication no
permitrootlogin no
pubkeyauthentication yes
kbdinteractiveauthentication no
```

注意：

- 修复前必须确认 `ssh web-vps` key 登录可用。
- 我已经确认过 `web-vps` alias 可用，但正式修复仍建议保留一个当前 SSH 会话不要断开。

### F2 中高优先级：旧 Sydney VPS 残留 TTS 入口

证据：

旧 VPS Caddyfile 仍有：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

旧 VPS 仍监听：

```text
127.0.0.1:8787 node
```

风险：

- 虽然 DNS 已经把 `tts.cliffordchen.org` 指向新 Seoul VPS，但旧 Sydney VPS 仍有残留服务。
- 如果有人直接打旧 IP 并伪造 Host header，可能触达旧 Caddy route。
- 这会增加旧 VPN VPS 的非必要暴露面，也可能继续持有旧 ElevenLabs 环境变量。

建议修复：

在旧 Sydney VPS 上：

```bash
ssh vps
sudo systemctl disable --now tts-proxy
sudo rm -f /etc/systemd/system/tts-proxy.service
sudo systemctl daemon-reload
```

然后编辑 Caddyfile，删除：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

验证并 reload：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
systemctl is-active caddy
systemctl is-active sing-box
```

注意：

- 只 reload Caddy，不 restart。
- 不修改 sing-box。
- 不修改 ufw。

### F3 中优先级：TTS endpoint 缺少真正鉴权

现状：

- TTS proxy 有 CORS 白名单。
- 有每 IP 限流。
- 有每日请求/字符上限。
- 有成功缓存和失败缓存。

风险：

- CORS 只限制浏览器，不限制 curl、脚本、爬虫。
- 任何人知道 endpoint 后，都可以直接 POST：

```text
https://tts.cliffordchen.org/speak
```

- 限流可以降低损失，但不是鉴权。

建议：

短期：

- 保留现在的每日上游请求和字符上限。
- 将 `DAILY_REQUEST_LIMIT` 和 `DAILY_CHARACTER_LIMIT` 设置得更保守，等 voice/API 权限确认后再放宽。

中期：

- 加一个站点 token：

```text
X-Site-Token
```

但注意：

- 如果 token 写在前端，它不是秘密，只能阻挡低级扫描。

更好的中期方案：

- 使用 Cloudflare Turnstile 或 Cloudflare WAF/rate limiting。
- 限制 `/speak` 只接受来自你的页面的正常浏览器行为。

长期：

- 优先考虑预生成音频。
- 对博客固定课程内容，预生成 MP3 是最安全、最省钱的方案。

### F4 中优先级：主站和 blog 缺少基础安全响应头

证据：

```powershell
curl.exe -I https://cliffordchen.org/
curl.exe -I https://blog.cliffordchen.org/
```

主站和 blog 缺少：

```text
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Content-Security-Policy
```

风险：

- 缺少 HSTS，浏览器不会强制 HTTPS。
- 缺少 `nosniff`，老旧浏览器或边缘场景下 MIME sniffing 风险更高。
- 缺少 CSP，对未来 HTML/JS 增长后的 XSS 防护较弱。

建议 Caddy 增加基础 header：

```caddyfile
header {
	Strict-Transport-Security "max-age=31536000; includeSubDomains"
	X-Content-Type-Options "nosniff"
	Referrer-Policy "strict-origin-when-cross-origin"
	Permissions-Policy "geolocation=(), microphone=(), camera=()"
}
```

CSP 需要谨慎：

- 当前法语互动页使用大量 inline script 和 inline event handler。
- 直接上严格 CSP 会破坏页面。
- 建议先做基础 header，后续再重构 HTML 交互页，逐步上 CSP。

### F5 中低优先级：TTS 缓存没有磁盘上限

现状：

```text
/var/cache/tts-proxy/audio
```

会存放 MP3、失败缓存、每日 usage 文件。

风险：

- 长期运行后，缓存可能增长。
- 如果被滥用，即使有每日限制，也可能逐步占用磁盘。

建议：

- 增加定期清理策略。
- 例如保留最近 90 天失败缓存，音频缓存设置总大小上限。
- 或增加 cron/systemd timer。

短期手动检查：

```bash
ssh web-vps
sudo du -sh /var/cache/tts-proxy
sudo find /var/cache/tts-proxy -type f | wc -l
```

### F6 中低优先级：交互 HTML 使用 inline event handler

现状：

```html
onclick="speak('...')"
```

风险：

- 当前内容是自有静态内容，风险可控。
- 如果未来从外部导入 HTML、AI 生成 HTML、或允许用户提交内容，inline event handler 会显著增加 XSS 风险。

建议：

- 未来将交互 HTML 改成：

```html
<button data-speak="Bonjour">...</button>
```

并用统一 JS：

```javascript
document.addEventListener("click", ...)
```

- 用 `textContent` 替代 `innerHTML` 写状态文本。
- 这样以后更容易加 CSP。

### F7 低优先级：错误信息向客户端返回上游细节

现状：

当 ElevenLabs 返回错误时，proxy 返回：

```text
ElevenLabs request failed: {... upstream detail ...}
```

风险：

- 可能泄露上游 request id、套餐状态、voice 权限信息。
- 不泄露 API key，但会提供一些服务指纹。

建议：

- 客户端返回简短错误：

```json
{ "error": "TTS upstream unavailable." }
```

- 服务端日志中保留详细错误。

当前 systemd 日志权限较受限，后续可根据需要增加日志查看方式。

## 4. 做得好的地方

### 4.1 API key 没进 Git

本地扫描没有发现真实 ElevenLabs API key。

### 4.2 TTS proxy 不直接暴露公网

新 VPS 监听：

```text
127.0.0.1:8787
```

公网只通过 Caddy 访问。

### 4.3 systemd 运行用户较安全

TTS proxy 使用：

```text
User=tts-worker
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
```

比 root 运行安全很多。

### 4.4 架构隔离方向正确

旧 VPN VPS 和新 Web VPS 已经分离：

- 旧 VPS 继续做 VPN 和真实主站。
- 新 VPS 承担公开 Web API。

这比把 TTS/Umami 全部堆在旧 VPN VPS 上更安全。

### 4.5 依赖没有发现已知漏洞

`npm audit --omit=dev` 对博客和 TTS proxy 都返回：

```text
found 0 vulnerabilities
```

## 5. 建议处理顺序

### 立即处理

1. 修复新 Seoul VPS 的 SSH 密码登录实际生效问题。
2. 清理旧 Sydney VPS 的 TTS proxy 进程和 Caddy `tts` block。

### 接下来处理

3. 给主站和 blog 添加基础安全 header。
4. 给 TTS proxy 增加更明确的调用鉴权或 Cloudflare WAF/rate limiting。

### 后续优化

5. 给 TTS 缓存增加清理策略。
6. 重构交互 HTML，减少 inline JS，为未来 CSP 做准备。
7. 对固定课程内容考虑预生成 MP3，减少运行时 API 暴露面。

## 6. 建议的下一步命令

### 6.1 修复新 Seoul VPS SSH 密码登录

```bash
ssh web-vps
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
sudo systemctl reload ssh
```

确认：

```text
passwordauthentication no
permitrootlogin no
pubkeyauthentication yes
kbdinteractiveauthentication no
```

### 6.2 清理旧 Sydney VPS TTS 残留

```bash
ssh vps
sudo systemctl disable --now tts-proxy
sudo rm -f /etc/systemd/system/tts-proxy.service
sudo systemctl daemon-reload
```

编辑：

```bash
sudo nano /etc/caddy/Caddyfile
```

删除：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

验证：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
systemctl is-active caddy
systemctl is-active sing-box
ss -lntup | grep ':8787' || true
```

### 6.3 给 Caddy 增加基础安全头

对 `cliffordchen.org`、`www.cliffordchen.org`、`blog.cliffordchen.org` 可添加：

```caddyfile
header {
	Strict-Transport-Security "max-age=31536000; includeSubDomains"
	X-Content-Type-Options "nosniff"
	Referrer-Policy "strict-origin-when-cross-origin"
	Permissions-Policy "geolocation=(), microphone=(), camera=()"
}
```

先不要贸然加严格 CSP，因为当前交互 HTML 依赖 inline script。

## 7. 结语

如果我是攻击者，我最先尝试的不是博客源码漏洞，而是：

1. 扫 SSH，尝试密码登录。
2. 找旧 IP 上是否还有不该存在的 TTS route。
3. 直接 POST `/speak` 消耗你的 ElevenLabs 额度。
4. 利用未来新增的交互 HTML/JS 找 XSS。

当前最值得马上做的两件事是：

```text
修复新 VPS PasswordAuthentication yes
清理旧 VPS TTS 残留
```

这两项处理后，整体安全面会明显收紧。
