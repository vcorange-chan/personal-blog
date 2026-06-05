# 安全升级实施报告

日期：2026-06-05  
关联审查报告：`docs/security-review-report.md`  
范围：新 Seoul Web VPS、旧 Sydney VPN VPS、TTS proxy、博客交互 HTML

## 1. 本次目标

根据安全审查报告中列出的 6 项问题，本次执行安全升级：

1. 修复新 Seoul VPS SSH 密码登录仍实际生效的问题。
2. 清理旧 Sydney VPS 上残留的 TTS proxy 和 `tts.cliffordchen.org` Caddy block。
3. 增强 TTS endpoint 防滥用能力。
4. 给主站和 blog 增加基础安全响应头。
5. 给 TTS 缓存增加上限和清理策略。
6. 降低交互 HTML 中 `innerHTML` 带来的 XSS 面。

## 2. 修复概览

最终状态：

```text
旧 Sydney VPS
  caddy active
  sing-box active
  tts-proxy inactive
  127.0.0.1:8787 不再监听
  Caddyfile 已无 tts.cliffordchen.org block
  cliffordchen.org / www 已加基础安全头

新 Seoul VPS
  passwordauthentication no
  permitrootlogin no
  pubkeyauthentication yes
  kbdinteractiveauthentication no
  caddy active
  tts-proxy active
  tts-proxy 只监听 127.0.0.1:8787
  blog / tts 已加基础安全头
```

代码提交：

```text
f47bf79 Harden TTS proxy and interactive page
```

## 3. 修复项 1：新 Seoul VPS SSH 密码登录

### 3.1 问题

安全审查中发现：

```text
passwordauthentication yes
```

虽然 root 登录已禁用，但普通用户密码登录仍实际生效。

### 3.2 修复方式

在新 Seoul VPS 上修改 cloud-init 生成的 SSH 配置：

```bash
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf
sudo sshd -t
sudo systemctl reload ssh
```

说明：

- `sshd -t` 用于验证 SSH 配置语法。
- `systemctl reload ssh` 是热加载，不断开当前会话。

### 3.3 验证

执行：

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
```

结果：

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
```

结论：

- 新 Seoul VPS 已禁用 SSH 密码登录。
- 仍允许 SSH key 登录。

## 4. 修复项 2：旧 Sydney VPS TTS 残留

### 4.1 问题

安全审查中发现旧 Sydney VPS 仍有：

```text
tts-proxy.service active
127.0.0.1:8787 node
```

并且旧 Caddyfile 中残留：

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

### 4.2 修复方式

用户在旧 Sydney VPS 上执行：

```bash
sudo systemctl disable --now tts-proxy
sudo rm -f /etc/systemd/system/tts-proxy.service
sudo systemctl daemon-reload
```

同时通过脚本重写 Caddyfile，删除 `tts.cliffordchen.org` block。

### 4.3 验证

执行：

```bash
systemctl is-active caddy
systemctl is-active sing-box
systemctl is-active tts-proxy 2>/dev/null || true
ss -lntup | grep ':8787' || true
sed -n '1,120p' /etc/caddy/Caddyfile
```

结果：

```text
caddy active
sing-box active
tts-proxy inactive
```

并且：

```text
ss -lntup | grep ':8787'
```

无输出。

结论：

- 旧 Sydney VPS 上 TTS proxy 已停止。
- 旧 Sydney VPS 已不再监听 `8787`。
- 旧 Sydney VPS Caddyfile 已无 `tts.cliffordchen.org` block。
- VPN / sing-box 未受影响。

## 5. 修复项 3：TTS endpoint 防滥用

### 5.1 问题

原 TTS endpoint 依赖：

- CORS 白名单。
- 每 IP 限流。
- 每日请求/字符上限。

但 CORS 不是认证，非浏览器客户端可以直接调用。

### 5.2 修复方式

在 `tts-proxy/src/server.js` 中增加 Origin gate：

```javascript
function enforceAllowedOrigin(req) {
	const origin = req.get("origin");
	if (!origin && ALLOW_MISSING_ORIGIN) return;
	if (origin && ALLOWED_ORIGINS.has(origin)) return;
	throw httpError(403, "TTS requests are not allowed from this origin.");
}
```

并在 `/speak` 入口最前面调用：

```javascript
enforceAllowedOrigin(req);
```

新增环境变量：

```text
ALLOW_MISSING_ORIGIN=false
```

说明：

- 浏览器请求必须来自 `ALLOWED_ORIGINS`。
- 无 Origin 的普通 curl/扫描请求会被拒绝。
- 这不是强认证，因为攻击者仍可伪造 Origin。
- 后续更强方案是 Cloudflare WAF、Turnstile 或预生成音频。

### 5.3 验证

无 Origin 请求测试：

```powershell
Invoke-WebRequest -Uri 'https://tts.cliffordchen.org/speak' -Method POST -ContentType 'application/json' -Body '{"text":"Bonjour","voice":"french"}'
```

结果：

```text
403
```

结论：

- 无 Origin 的直接请求已被拒绝。

## 6. 修复项 4：主站和 blog 安全响应头

### 6.1 问题

安全审查发现 `cliffordchen.org` 和 `blog.cliffordchen.org` 缺少基础安全响应头。

### 6.2 修复方式

旧 Sydney VPS 主站 block 增加：

```caddyfile
header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
}
```

新 Seoul VPS `blog.cliffordchen.org` block 增加同类 header。

`tts.cliffordchen.org` 增加：

```caddyfile
header {
	Strict-Transport-Security "max-age=31536000; includeSubDomains"
	X-Content-Type-Options "nosniff"
	Referrer-Policy "strict-origin-when-cross-origin"
}
```

说明：

- 暂时没有添加严格 CSP。
- 原因是当前交互 HTML 依赖 inline script 和 inline event handler。
- 如果直接上严格 CSP，会破坏交互文章。

### 6.3 验证

执行：

```powershell
curl.exe -I https://cliffordchen.org/
curl.exe -I https://blog.cliffordchen.org/
curl.exe -I https://tts.cliffordchen.org/health
```

确认看到：

```text
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

其中 `tts` 没有 `Permissions-Policy`，因为它是 API endpoint，不需要浏览器能力策略。

## 7. 修复项 5：TTS 缓存上限和清理

### 7.1 问题

原缓存目录：

```text
/var/cache/tts-proxy/audio
```

没有大小上限和清理策略。

### 7.2 修复方式

新增环境变量：

```text
CACHE_MAX_BYTES=104857600
CACHE_MAX_AGE_DAYS=90
CACHE_CLEANUP_INTERVAL_MS=21600000
```

含义：

- 缓存最大约 100 MB。
- 缓存文件最长保留 90 天。
- 每 6 小时清理一次。

新增逻辑：

- 服务启动时执行一次清理。
- 之后定时清理。
- 过期失败缓存会被删除。
- 超过总大小时，从最旧文件开始删除。

### 7.3 验证

执行：

```bash
sudo du -sh /var/cache/tts-proxy
```

结果：

```text
20K /var/cache/tts-proxy
```

结论：

- 当前缓存占用很小。
- 清理机制已部署。

## 8. 修复项 6：交互 HTML 的 `innerHTML`

### 8.1 问题

法语交互 HTML 中，状态栏使用：

```javascript
banner.innerHTML = message;
```

当前消息是固定文本，风险不高；但如果未来状态信息来自外部数据，可能扩大 XSS 面。

### 8.2 修复方式

改为：

```javascript
banner.textContent = message;
```

文件：

```text
public/interactive/lecon-1.html
```

### 8.3 仍保留的风险

HTML 中仍有大量：

```html
onclick="speak('...')"
```

当前内容是自有静态内容，暂时可接受。

后续建议：

- 改成 `data-speak` 属性。
- 使用统一事件委托。
- 为将来添加 CSP 做准备。

## 9. 部署与验证命令摘要

### 9.1 本地代码验证

```powershell
npm run check
npm run build
rg "<root_password_fragment>|sk_|ELEVENLABS_API_KEY=.*[A-Za-z0-9]|<voice_id>|BEGIN (RSA|OPENSSH|PRIVATE) KEY" tts-proxy src public docs
```

结果：

- TTS proxy 语法检查通过。
- Astro build 通过。
- 未发现真实 key、root 密码、voice id、私钥。

### 9.2 新 Seoul VPS 验证

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
systemctl is-active caddy
systemctl is-active tts-proxy
sudo du -sh /var/cache/tts-proxy
sudo ss -lntup | egrep ':80|:443|:8787' || true
```

结果：

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
caddy active
tts-proxy active
127.0.0.1:8787
```

### 9.3 旧 Sydney VPS 验证

```bash
systemctl is-active caddy
systemctl is-active sing-box
systemctl is-active tts-proxy 2>/dev/null || true
ss -lntup | grep ':8787' || true
sed -n '1,120p' /etc/caddy/Caddyfile
```

结果：

```text
caddy active
sing-box active
tts-proxy inactive
```

`8787` 无监听。

### 9.4 公网响应头验证

```powershell
curl.exe -I https://cliffordchen.org/
curl.exe -I https://blog.cliffordchen.org/
curl.exe -I https://tts.cliffordchen.org/health
```

结果：

- `cliffordchen.org` 有安全头。
- `blog.cliffordchen.org` 有安全头。
- `tts.cliffordchen.org/health` 有安全头。

## 10. 残余风险

### 10.1 TTS Origin gate 不是强认证

当前已阻止无 Origin 的请求，但攻击者可以伪造 Origin。

进一步增强建议：

- Cloudflare WAF/rate limiting。
- Turnstile。
- 对固定课程内容改成预生成 MP3。

### 10.2 严格 CSP 尚未启用

原因：

- 法语交互 HTML 依赖 inline script 和 inline event handler。

后续路线：

1. 移除 inline `onclick`。
2. 使用外部 JS 文件。
3. 加 CSP。

### 10.3 旧 Sydney VPS 的 SSH 配置未完整复核

旧 Sydney VPS sudo 需要用户输入密码，本次没有完整读取实际 `sshd -T`。

后续可以手动检查：

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)'
```

## 11. 当前完成状态

六项审查问题处理状态：

```text
1. Seoul SSH 密码登录实际生效          已修复
2. Sydney TTS 残留                    已修复
3. TTS endpoint 缺少基本调用门槛       已缓解
4. 主站/blog 缺少基础安全头            已修复
5. TTS 缓存无上限                     已修复
6. HTML innerHTML 风险                已修复
```

本次升级没有：

- 提交真实 ElevenLabs API key。
- 提交 root 密码。
- 提交真实 voice id。
- 修改旧 Sydney VPS 的 sing-box 配置。
- 重启旧 Sydney VPS 的 sing-box。
