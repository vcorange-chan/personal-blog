# 全站发布前巡检与安全体检报告

日期：2026-06-06

## 目标

本次巡检目标是确认 Phase 9 评论系统上线后，博客主要页面、内容功能、移动端导航入口和基础安全设置仍然正常。

检查范围：

- 首页
- 普通文章页
- 法语互动 HTML 文章页
- 法语音频测试文章页
- Academia 页面
- 评论区
- 移动端导航相关入口
- RSS、sitemap、robots
- 基础安全响应头
- 常见敏感路径暴露风险

## 功能巡检结果

### 1. 线上页面状态

检查命令：

```powershell
$urls = @(
  "https://blog.cliffordchen.org/",
  "https://blog.cliffordchen.org/posts/math/algebra/math-code-typesetting-test/",
  "https://blog.cliffordchen.org/posts/lang/french/lecon-1-interactive/",
  "https://blog.cliffordchen.org/posts/lang/french/french-note-audio-test/",
  "https://blog.cliffordchen.org/academia/",
  "https://blog.cliffordchen.org/academia/reviews/",
  "https://blog.cliffordchen.org/series/",
  "https://blog.cliffordchen.org/tags/",
  "https://blog.cliffordchen.org/rss.xml",
  "https://blog.cliffordchen.org/sitemap-index.xml",
  "https://blog.cliffordchen.org/robots.txt",
  "https://blog.cliffordchen.org/audio/french/bonjour-test.wav",
  "https://blog.cliffordchen.org/interactive/lecon-1.html"
)

foreach ($u in $urls) {
  Invoke-WebRequest -UseBasicParsing -Uri $u
}
```

结果：

- 首页：200
- 普通文章页：200
- 法语互动 HTML 文章页：200
- 法语音频测试文章页：200
- Academia：200
- Academia Reading Notes：200
- Series：200
- Tags：200
- RSS：200
- sitemap：200
- robots：200
- 法语测试音频：200，`audio/wav`
- 独立互动 HTML：200

结论：

主要公开页面和静态资源均可正常访问。

### 2. 评论区

检查命令：

```powershell
$html = (Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org/posts/math/algebra/math-code-typesetting-test/").Content
$html.Contains("giscus.app/client.js")
```

结果：

- 普通文章页包含 `giscus.app/client.js`。
- 用户已经在线上确认评论区可见。
- `layout: immersive` 的法语互动 HTML 文章页不包含 giscus 评论区。

结论：

评论系统已上线；普通文章显示评论区，沉浸式互动文章不显示评论区，符合当前设计。

### 3. 法语音频与 French Card

检查命令：

```powershell
$html = (Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org/posts/lang/french/french-note-audio-test/").Content
$html.Contains("french-card")
$html.Contains("<audio") -and $html.Contains("controls")
```

结果：

- 页面包含 `.french-card`。
- 页面包含 `<audio controls>`。
- 音频资源 `https://blog.cliffordchen.org/audio/french/bonjour-test.wav` 返回 200。

结论：

Phase 7 的法语笔记音频验收路径仍然正常。

### 4. Academia 页面

检查命令：

```powershell
$html = (Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org/academia/").Content
$html.Contains("Publications")
$html.Contains("In Progress")
$html.Contains("Writing")
$html.Contains("Reading Notes")
```

结果：

- Publications 存在。
- In Progress 存在。
- Writing 存在。
- Reading Notes 存在。

结论：

Phase 8 的 Academia 页面结构仍然正常。

### 5. 移动端导航与 UI 语言入口

检查命令：

```powershell
$html = (Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org/").Content
$html.Contains("toggle-navigation-menu")
$html.Contains("data-ui-language-button")
```

结果：

- 首页、文章页、法语页面、Academia 页面均包含移动端导航按钮标记。
- 页面均包含 UI 语言切换按钮标记。

结论：

移动端导航入口和 UI 语言切换入口仍然存在。此次巡检未发现路由层面的缺失。

## 安全体检结果

### 1. HTTPS 与 HTTP 跳转

检查命令：

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://blog.cliffordchen.org/" -MaximumRedirection 0
```

结果：

```text
Status: 308
Location: https://blog.cliffordchen.org/
```

结论：

HTTP 会跳转到 HTTPS，正常。

### 2. 基础安全响应头

检查命令：

```powershell
$r = Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org/" -Method Head
$r.Headers
```

检查到的关键响应头：

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Server: Caddy
```

结论：

基础安全响应头已生效。

注意：

- 当前没有启用 `Content-Security-Policy`。
- 这不是立即漏洞，但属于后续可增强项。
- 因为站点使用 giscus、KaTeX、Astro 内联脚本和互动 HTML 页面，CSP 不适合仓促添加，建议后续先用 `Content-Security-Policy-Report-Only` 做观察。

### 3. 敏感路径暴露检查

检查命令：

```powershell
$paths = @(
  "/.env",
  "/.git/config",
  "/package.json",
  "/src/site.config.ts",
  "/node_modules/",
  "/tts-proxy/src/server.js"
)

foreach ($p in $paths) {
  Invoke-WebRequest -UseBasicParsing -Uri "https://blog.cliffordchen.org$p"
}
```

结果：

```text
/.env                       404
/.git/config                404
/package.json               404
/src/site.config.ts         404
/node_modules/              404
/tts-proxy/src/server.js    404
```

结论：

常见敏感路径没有从静态站点暴露。

### 4. giscus 安全性

检查内容：

- giscus 只使用公开 repo 信息：`repo`、`repoId`、`categoryId`。
- 没有 GitHub token。
- 没有把 API key 写入前端。
- 评论由 GitHub Discussions 承载，权限控制在 GitHub 侧。

结论：

当前 giscus 集成没有发现密钥泄露风险。

需要注意：

- giscus 是第三方脚本，来源为 `https://giscus.app/client.js`。
- 后续如果启用 CSP，需要把 giscus 相关脚本、iframe、连接域名加入允许列表。

### 5. 本地构建与代码检查

检查命令：

```powershell
npm run check
```

结果：

```text
astro check: 0 errors, 0 warnings, 0 hints
biome check: Checked 63 files. No fixes applied.
```

结论：

当前代码检查通过。

## 发现的问题

本次没有发现会阻止发布的高优先级问题。

仍建议后续处理的增强项：

- 增加 CSP，但先用 Report-Only 模式测试。
- 对互动 HTML 内容继续保持“只发布自己可信内容”的原则，不承载外部不可信 HTML。
- 后续如果评论区需要更强管理，可以在 GitHub Discussions 中设置 moderation 规则。
- 若移动端导航后续内容继续变多，可以考虑把部分分类入口收进 Explore 菜单，保持小屏幕简洁。

## 总结

当前博客发布前巡检通过：

- 主要页面正常。
- 评论系统在线可见。
- 法语音频页面正常。
- Academia 页面正常。
- 移动端导航入口存在。
- HTTPS 跳转正常。
- 基础安全响应头存在。
- 常见敏感路径没有暴露。
- `npm run check` 通过。

