# 博客发布指南

## 1. 目前支持的内容格式

### 1.1 正式博客文章

当前 content collection 读取：

```text
src/content/posts/**/*.md
src/content/posts/**/*.mdx
```

所以正式博客文章支持：

```text
Markdown: .md
MDX: .mdx
```

文章必须带 frontmatter，例如：

```yaml
---
title: "文章标题"
date: 2026-06-05
category: tech
subcategory: rust
tags:
  - rust
lang: zh
description: "文章描述"
draft: false
---
```

### 1.2 交互 HTML

完整 HTML 文件不直接放进 content collection。

推荐方式：

```text
public/interactive/example.html
src/content/posts/.../example.md
```

在 Markdown wrapper 中用 iframe：

```html
<iframe src="/interactive/example.html"></iframe>
```

如果是交互课件、动画、工具页面，frontmatter 加：

```yaml
layout: immersive
```

这样页面会使用宽屏沉浸式布局，不会被普通文章窄正文压缩。

### 1.3 图片和静态资源

图片、音频、PDF、下载文件等放在：

```text
public/
```

例如：

```text
public/images/algebra/P16.jpg
```

文章中引用：

```markdown
![P16](/images/algebra/P16.jpg)
```

## 2. 写完文章后的标准流程

### 2.1 本地检查

```powershell
npm run build
```

### 2.2 同步 GitHub

```powershell
git add .
git commit -m "Add new blog post"
git push
```

GitHub 保存源码和文章，但不会自动部署 VPS。

### 2.3 部署 VPS

```powershell
npm run deploy
```

这个命令会：

1. 运行 `npm run build`。
2. 打包 `dist/`。
3. 上传并部署到新 Seoul VPS：

```text
https://blog.cliffordchen.org/
```

4. 上传同一份包到旧 Sydney VPS：

```text
vps:~/blog-dist.tar
```

5. 如果旧 Sydney VPS 需要 sudo 密码，脚本会输出手动命令。

## 3. 旧 Sydney VPS 手动部署

由于旧 Sydney VPS 的 sudo 需要密码，`npm run deploy` 不能自动替换主站。

脚本会输出类似命令：

```bash
ssh vps
set -e; sudo install -d -o caddy -g caddy '/var/www/cliffordchen.org'; backup='/var/www/cliffordchen.org'.before-deploy.$(date -u +%Y%m%d-%H%M%S); sudo cp -a '/var/www/cliffordchen.org' "$backup"; sudo find '/var/www/cliffordchen.org' -mindepth 1 -maxdepth 1 -exec rm -rf {} +; sudo tar -xf ~/blog-dist.tar -C '/var/www/cliffordchen.org'; sudo chown -R caddy:caddy '/var/www/cliffordchen.org'; curl -fsSI 'https://cliffordchen.org/' >/dev/null
```

复制执行即可。

## 4. 部署脚本配置

脚本位置：

```text
scripts/deploy-blog.mjs
```

默认目标：

```text
BLOG_WEB_HOST=web-vps
BLOG_SYDNEY_HOST=vps
BLOG_WEB_ROOT=/var/www/cliffordchen.org
BLOG_SYDNEY_ROOT=/var/www/cliffordchen.org
```

如需临时覆盖：

```powershell
$env:BLOG_WEB_HOST="web-vps"
npm run deploy
```

## 5. 注意事项

- 不要把 `.env`、API key、root 密码、SSH private key 提交到 Git。
- 交互 HTML 如果来自外部或 AI 生成，发布前需要额外安全检查。
- `public/` 下的内容会原样发布到网站。
- `draft: true` 的文章不会作为正式文章展示。

