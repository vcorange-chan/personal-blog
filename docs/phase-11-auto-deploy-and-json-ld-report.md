# Phase 11 双 VPS 自动部署与 JSON-LD 结构化数据报告

日期：2026-06-06

## 目标

Phase 11 的目标：

- 把 `scripts/deploy-blog.mjs` 改成真正的双 VPS 自动部署。
- 部署时自动同步 Seoul `blog.cliffordchen.org` 和 Sydney `cliffordchen.org`。
- 部署时自动应用并验证 `Content-Security-Policy-Report-Only`。
- 为文章页添加 JSON-LD 结构化数据，提升搜索引擎理解能力。

## 完成状态

- [x] Seoul Web VPS 自动部署。
- [x] Sydney VPS 自动部署。
- [x] 两台 VPS 部署后自动验证首页、404、RSS、法语互动页。
- [x] 两台 VPS 部署后自动验证 CSP Report-Only 响应头。
- [x] 文章页输出 JSON-LD。
- [x] JSON-LD 包含 `Person`、`Blog`、`BreadcrumbList`、`BlogPosting`。
- [x] 本地 `npm run check` 通过。
- [x] 新部署脚本已真实执行成功。

## 实际改动

### 1. 双 VPS 自动部署

文件：

- `scripts/deploy-blog.mjs`

改动：

- 将部署逻辑整理成 `deployTarget()`。
- 每个目标 VPS 都执行：
  - 检查受限 sudo 是否可用。
  - 上传 `blog-dist.tar`。
  - 上传 `scripts/apply-caddy-csp-report-only.py` 到 `/tmp/apply-caddy-csp-report-only.py`。
  - 备份旧站点目录。
  - 清空站点目录。
  - 解压新构建产物。
  - 设置 `caddy:caddy` 权限。
  - 应用 CSP Report-Only。
  - `caddy fmt`。
  - `caddy validate`。
  - `systemctl reload caddy`。
  - 验证线上 URL。

自动验证的 Seoul URL：

```text
https://blog.cliffordchen.org/
https://blog.cliffordchen.org/404.html
https://blog.cliffordchen.org/rss.xml
https://blog.cliffordchen.org/posts/lang/french/lecon-1-interactive/
```

自动验证的 Sydney URL：

```text
https://cliffordchen.org/
https://cliffordchen.org/404.html
https://cliffordchen.org/rss.xml
https://cliffordchen.org/posts/lang/french/lecon-1-interactive/
```

### 2. 受限 sudo 检测修正

最初使用：

```bash
sudo -n true
```

问题：

- 这个检测太宽。
- 你的 Sydney sudoers 更接近“只允许部署相关命令免密码”，不一定允许 `true`。

修正后使用：

```bash
sudo -n caddy version >/dev/null
```

原因：

- `caddy` 是部署流程真实需要的命令。
- 这个检测更符合受限 sudo 的安全模型。

### 3. CSP Report-Only 脚本去重

文件：

- `scripts/apply-caddy-csp-report-only.py`

改动：

- 修复重复插入 `Content-Security-Policy-Report-Only` 的问题。
- 新逻辑会在目标站点 header block 中去重，只保留一条 CSP Report-Only。

线上检查：

```text
Seoul Caddyfile 中有 2 条 CSP Report-Only：
- http://141.164.39.98
- blog.cliffordchen.org

Sydney Caddyfile 中有 1 条 CSP Report-Only：
- cliffordchen.org, www.cliffordchen.org
```

这是正常结果，不是重复错误。

### 4. 文章页 JSON-LD

新增文件：

- `src/components/blog/StructuredData.astro`

修改文件：

- `src/layouts/BlogPost.astro`

每篇文章自动输出：

- `Person`
- `Blog`
- `BreadcrumbList`
- `BlogPosting`

字段来源：

- `title`
- `description`
- `date`
- `updatedDate`
- `category`
- `subcategory`
- `tags`
- `lang`
- 动态 OG 图片 URL
- canonical URL

示例类型：

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Person" },
    { "@type": "Blog" },
    { "@type": "BreadcrumbList" },
    { "@type": "BlogPosting" }
  ]
}
```

说明：

- JSON-LD 脚本使用 `type="application/ld+json"`。
- 已显式设置 `is:inline`，避免 Astro 提示。
- 输出位置在文章页面 body 开头，搜索引擎可读取。

## 验证命令与结果

本地检查：

```powershell
node --check scripts\deploy-blog.mjs
npm run check
npm run deploy
```

结果：

- `node --check` 通过。
- `npm run check` 通过。
- Astro diagnostics：0 errors / 0 warnings / 0 hints。
- Biome：通过。
- `npm run deploy` 已成功更新 Seoul 和 Sydney。

部署结果：

```text
Seoul blog deployment was updated and verified.
Sydney main site deployment was updated and verified.
Deployment script finished.
Seoul and Sydney deployments were updated and verified.
```

线上 JSON-LD 抽检：

```text
https://blog.cliffordchen.org/posts/math/algebra/math-code-typesetting-test/
JsonLd: true
BlogPosting: true
BreadcrumbList: true
CSP Report-Only: true

https://cliffordchen.org/posts/math/algebra/math-code-typesetting-test/
JsonLd: true
BlogPosting: true
BreadcrumbList: true
CSP Report-Only: true
```

## 之后如何发布

以后写完文章后，本机执行：

```powershell
git add .
git commit -m "Add new post"
git push
npm run deploy
```

`npm run deploy` 现在会自动同步：

- Seoul `blog.cliffordchen.org`
- Sydney `cliffordchen.org`

## 注意事项

- Sydney 自动部署依赖你刚配置好的受限 sudo。
- 如果以后修改 Sydney sudoers，需要保留部署脚本使用的命令权限。
- 如果未来接入 Umami，需要同步更新 CSP Report-Only 策略，把 Umami 域名加入允许列表。

