# Phase 10 发布前元数据、安全头与站点体验报告

日期：2026-06-06

## 目标

Phase 10 的目标是补齐发布前的站点基础设施体验：

- 使用 `Content-Security-Policy-Report-Only` 做 CSP 观察，不启用阻断。
- 保留测试内容，暂时不接入 Umami。
- 检查 sitemap、robots、RSS。
- 改进 404 页面。
- 改进 Open Graph 图片和站点图标。

## 完成状态

- [x] Seoul Web VPS 已添加 `Content-Security-Policy-Report-Only`。
- [x] CSP 目前是 report-only，不会阻断页面脚本、评论区、KaTeX 或互动 HTML。
- [x] sitemap 与 robots 已检查，构建产物正常生成。
- [x] RSS 文案已更新。
- [x] Umami 保持不启用。
- [x] 404 页面已升级为可导航页面。
- [x] Open Graph 默认分享图已替换为 Clifford Chen 临时品牌图。
- [x] 站点图标已替换为正方形 `CC` SVG，并可生成 favicon 和 app icons。
- [x] Seoul `blog.cliffordchen.org` 已部署并完成线上抽检。
- [ ] Sydney VPS 主站的 CSP Report-Only 需要你输入 sudo 密码后手动执行。

## 实际改动

### 1. CSP Report-Only

文件：

- `scripts/apply-caddy-csp-report-only.py`

用途：

- 修改 Caddyfile。
- 给静态博客站点 block 添加：

```text
Content-Security-Policy-Report-Only
```

当前策略：

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'self';
img-src 'self' data: https:;
font-src 'self' data:;
style-src 'self' 'unsafe-inline' https://giscus.app;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://giscus.app;
connect-src 'self' https://giscus.app https://api.github.com https://*.giscus.app;
frame-src https://giscus.app
```

说明：

- 这是 Report-Only，不会阻止资源加载。
- 目前没有配置上报 endpoint，所以主要用于浏览器 console 和响应头观察。
- 后续如果要正式启用 CSP，应先接入 report endpoint 或至少观察一段时间。

Seoul Web VPS 已执行：

```bash
sudo python3 /tmp/apply-caddy-csp-report-only.py
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -fsSI https://blog.cliffordchen.org/ | grep -i 'content-security-policy-report-only'
```

结果：

- Caddy 配置验证通过。
- Caddy reload 成功。
- `https://blog.cliffordchen.org/` 已返回 `content-security-policy-report-only` 响应头。

线上抽检结果：

```text
https://blog.cliffordchen.org/    200
content-security-policy-report-only: present
strict-transport-security: present
x-content-type-options: nosniff
```

Sydney VPS 状态：

- 脚本已上传到 `/tmp/apply-caddy-csp-report-only.py`。
- 因为 Sydney VPS 的 sudo 需要交互密码，需要你手动执行。

手动命令：

```bash
ssh vps
sudo python3 /tmp/apply-caddy-csp-report-only.py
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -fsSI https://cliffordchen.org/ | grep -i 'content-security-policy-report-only'
```

### 2. Sitemap 与 Robots

检查命令：

```powershell
npm run build
Get-Content dist\robots.txt
Get-Content dist\sitemap-index.xml
```

结果：

- `dist/sitemap-index.xml` 已生成。
- `dist/sitemap-0.xml` 已生成。
- `dist/robots.txt` 已生成。

当前 `robots.txt`：

```text
User-agent: *
Allow: /
Sitemap: https://cliffordchen.org/sitemap-index.xml
```

说明：

- sitemap 和 robots 的 canonical 域名来自 `src/site.config.ts` 的 `siteConfig.url`。
- 当前值是 `https://cliffordchen.org/`，符合“主站最终也是博客”的策略。
- `blog.cliffordchen.org` 可以作为博客子域访问，但 SEO canonical 仍指向主站域名。

### 3. RSS 文案

文件：

- `src/pages/rss.xml.ts`

改动：

- RSS 标题从 `Clifford Chen` 改为 `Clifford Chen - Blog`。
- RSS 描述增加了内容范围说明：

```text
A place for mathematics, software, and long-form thinking. Notes on mathematics, software, academia, languages, and reading.
```

### 4. 404 页面

文件：

- `src/pages/404.astro`

改动：

- 从默认短提示升级为可导航的 404 页面。
- 添加入口：
  - Home
  - Posts
  - Tags
  - Academia

构建检查：

- `dist/404.html` 已生成。

### 5. Open Graph 图片

文件：

- `public/social-card.png`
- `scripts/generate-social-card.mjs`
- `src/components/BaseHead.astro`
- `src/pages/og-image/_ogMarkup.ts`
- `src/pages/og-image/_cacheUtil.ts`

改动：

- 替换旧的 Astro Cactus 默认分享图。
- 新增 Clifford Chen 临时品牌分享图。
- 为 OG/Twitter 图片添加 alt 文案。
- 动态文章 OG 图模板改为旧书风格。
- OG 图片缓存版本从 `v1` 升级为 `v2`，避免继续使用旧缓存。

生成命令：

```powershell
node scripts\generate-social-card.mjs
```

注意：

- 生成时出现过 `Fontconfig error: No writable cache directories` 提示。
- 图片仍成功生成，文件已验证可正常预览。

### 6. 站点图标

文件：

- `public/icon.svg`
- `astro.config.ts`

改动：

- 把原 Cactus 非正方形图标替换为正方形 `CC` SVG。
- webmanifest `short_name` 改为 `Clifford`。
- webmanifest 颜色改为旧书配色：
  - `background_color: #F5F1E8`
  - `theme_color: #9A3F2F`

构建结果：

- `dist/favicon-32x32.png`
- `dist/icons/apple-touch-icon.png`
- `dist/icons/icon-192.png`
- `dist/icons/icon-512.png`
- `dist/manifest.webmanifest`

均已生成。

## 验证命令

已执行：

```powershell
npm run build
npm run check
```

结果：

- `npm run build` 通过。
- `npm run check` 通过。
- Astro diagnostics：0 errors / 0 warnings / 0 hints。
- Biome：通过。

构建产物检查：

```text
dist/sitemap-index.xml           exists
dist/sitemap-0.xml               exists
dist/robots.txt                  exists
dist/rss.xml                     exists
dist/404.html                    exists
dist/social-card.png             exists
dist/favicon-32x32.png           exists
dist/icons/apple-touch-icon.png  exists
dist/icons/icon-192.png          exists
dist/icons/icon-512.png          exists
dist/manifest.webmanifest        exists
```

部署后线上抽检：

```text
https://blog.cliffordchen.org/404.html                                             200
https://blog.cliffordchen.org/rss.xml                                              200
https://blog.cliffordchen.org/robots.txt                                           200
https://blog.cliffordchen.org/sitemap-index.xml                                    200
https://blog.cliffordchen.org/manifest.webmanifest                                 200
https://blog.cliffordchen.org/social-card.png                                      200
https://blog.cliffordchen.org/favicon-32x32.png                                    200
https://blog.cliffordchen.org/og-image/math/algebra/math-code-typesetting-test.png 200
```

线上 HTML/RSS 检查：

```text
RSS title "Clifford Chen - Blog": true
og:image:alt: true
/social-card.png: true
theme-color: true
```

## 是否需要你提供图片

不需要你现在立刻提供图片。

我已经做了一个临时可用的文字品牌方案：

- 图标：`CC` monogram。
- OG 图：旧书风格 Clifford Chen 分享卡。

如果你之后愿意提供素材，最有价值的是：

- 正方形 logo 或头像，建议至少 `1024x1024`。
- Open Graph 横图，建议 `1200x630`。
- 如果只有一张高质量照片或手写签名，也可以，我可以再裁切和适配。

## 后续建议

- 观察 CSP Report-Only 一段时间，不急着切换为正式 CSP。
- 如果未来接入 Umami，再把 Umami 域名加入 CSP。
- 如果未来把 `blog.cliffordchen.org` 作为唯一 canonical 域名，需要同步修改 `src/site.config.ts` 的 `url`。
