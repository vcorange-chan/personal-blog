# Astro 个人博客初始化工作报告

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`

## 1. 任务目标

本次任务的目标是在当前 `Blogs` 文件夹中搭建一个 Astro 个人博客项目，使本地 Markdown 博客内容能够被 Astro 识别、渲染，并为之后同步到 GitHub 做准备。

## 2. 初始检查

我先检查了当前目录、Node/npm 环境和 Git 状态。

### 2.1 检查目录内容

```powershell
Get-ChildItem -Force
```

检查结果：

- 当前目录不是空目录。
- 原有内容只有一个博客文章文件夹：`Rust&ProgrammingLanguage`
- 其中包含一篇 Markdown：`Variables.md`

### 2.2 检查文章内容

```powershell
Get-ChildItem -Force 'Rust&ProgrammingLanguage'
Get-Content 'Rust&ProgrammingLanguage\Variables.md' -TotalCount 40
```

检查目的：

- 确认原有 Markdown 文件是否需要保留。
- 查看它是否已经包含 Astro 所需的 frontmatter。

检查结果：

- 文章是普通 Markdown。
- 没有 Astro content collection 需要的 frontmatter，例如 `title`、`description`、`pubDate`。

### 2.3 检查 Node 和 npm

```powershell
node --version
npm --version
```

检查结果：

- Node.js：`v24.14.0`
- npm：`11.12.0`

这两个版本可以满足当前 Astro 项目的运行要求。生成的 `package.json` 中要求 Node `>=22.12.0`。

### 2.4 检查 Git 状态

```powershell
git status --short
```

检查结果：

- 当前目录还不是 Git 仓库。
- 后续如果要同步 GitHub，需要再执行 `git init`、添加远程仓库并提交。

## 3. Astro 安装与项目生成

### 3.1 第一次尝试：直接在当前目录生成 Astro 项目

```powershell
npm create astro@latest . -- --template blog --install --no-git
```

命令含义：

- `npm create astro@latest`：使用 Astro 官方脚手架。
- `.`：尝试在当前目录初始化项目。
- `--template blog`：使用官方博客模板。
- `--install`：自动安装依赖。
- `--no-git`：不自动初始化 Git。

遇到的问题：

- Astro 检测到当前目录不是空目录。
- 因为已有 `Rust&ProgrammingLanguage/Variables.md`，脚手架没有直接写入当前目录。
- Astro 提示改用一个默认的新项目目录。

原因：

- Astro 脚手架为了避免覆盖已有文件，会在非空目录中阻止直接初始化。

解决办法：

- 不强行覆盖当前目录。
- 改为先在临时子目录中生成 Astro 项目，再把生成的项目文件移动到博客根目录。

### 3.2 第二次尝试：在临时目录生成 Astro 项目

```powershell
npm create astro@latest astro-starter-temp -- --template blog --install --no-git
```

结果：

- 成功创建临时项目目录：`astro-starter-temp`
- 成功复制 Astro 官方 blog 模板。
- 成功安装依赖。

安装的主要依赖：

```json
{
  "@astrojs/mdx": "^6.0.2",
  "@astrojs/rss": "^4.0.18",
  "@astrojs/sitemap": "^3.7.3",
  "astro": "^6.4.4",
  "sharp": "^0.34.3"
}
```

这些依赖的作用：

- `astro`：Astro 框架核心。
- `@astrojs/mdx`：支持 `.mdx` 文章。
- `@astrojs/rss`：生成 RSS 订阅文件。
- `@astrojs/sitemap`：生成 sitemap。
- `sharp`：用于图片优化。

## 4. 项目文件整理

### 4.1 检查临时项目内容

```powershell
Get-ChildItem -Force astro-starter-temp
```

生成的主要内容：

- `.vscode`
- `node_modules`
- `public`
- `src`
- `.gitignore`
- `astro.config.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `tsconfig.json`

### 4.2 移动项目文件到博客根目录

```powershell
Get-ChildItem -LiteralPath 'astro-starter-temp' -Force | ForEach-Object {
  Move-Item -LiteralPath $_.FullName -Destination .
}
```

目的：

- 把 Astro 项目真正放到 `Blogs` 根目录。
- 保留原有 Markdown 内容。

### 4.3 删除临时目录

```powershell
Remove-Item -LiteralPath 'astro-starter-temp'
```

说明：

- 此时临时目录已经为空。
- 只是删除我刚创建的临时目录，不影响原始文章。

## 5. 接入原有 Markdown 文章

### 5.1 检查 Astro 内容配置

```powershell
Get-Content src\content.config.ts
```

检查结果：

Astro 博客模板从下面目录加载文章：

```text
src/content/blog/
```

并要求每篇文章具备以下 frontmatter：

- `title`
- `description`
- `pubDate`
- 可选：`updatedDate`
- 可选：`heroImage`

### 5.2 移动原有文章

```powershell
New-Item -ItemType Directory -Force -Path 'src\content\blog\rust-programming-language' | Out-Null
Move-Item -LiteralPath 'Rust&ProgrammingLanguage\Variables.md' -Destination 'src\content\blog\rust-programming-language\variables.md'
Remove-Item -LiteralPath 'Rust&ProgrammingLanguage'
```

移动后的文章路径：

```text
src/content/blog/rust-programming-language/variables.md
```

最终访问路径：

```text
/blog/rust-programming-language/variables/
```

### 5.3 补充 frontmatter

我给文章顶部补充了：

```yaml
---
title: 'Rust 变量和可变性'
description: '关于 Rust 变量、可变性、内存地址与类型解释规则的学习笔记。'
pubDate: 2026-05-25
---
```

原因：

- Astro content collection 会校验文章 frontmatter。
- 如果缺少这些字段，构建时会失败或文章无法正常进入博客列表。

## 6. 项目信息修正

### 6.1 修改 `package.json`

我把项目名从临时目录名：

```json
"name": "astro-starter-temp"
```

改成：

```json
"name": "blogs"
```

### 6.2 修改 `package-lock.json`

因为 `package-lock.json` 也记录了项目名，所以同步修改了里面的两处 `name` 字段。

这样可以避免项目元信息仍然显示为临时目录名。

## 7. 构建验证

### 7.1 第一次构建

```powershell
npm run build
```

遇到的问题：

```text
EPERM: operation not permitted, mkdir 'C:\Users\1\AppData\Roaming\astro\Config'
```

原因：

- Astro 在第一次运行时会读取或创建 telemetry 配置。
- 这个配置目录位于用户级目录：`C:\Users\1\AppData\Roaming\astro\Config`
- 当前命令运行在受限沙盒中，没有权限写入该目录。

解决办法：

- 使用提升权限重新运行 `npm run build`。

### 7.2 提升权限后重新构建

```powershell
npm run build
```

结果：

- 构建成功。
- Astro 成功同步 content collection。
- 成功生成静态页面。
- 成功生成 sitemap。

构建输出中确认生成了文章页面：

```text
/blog/rust-programming-language/variables/index.html
```

## 8. 本地开发服务器验证

### 8.1 第一次启动 dev server

```powershell
npm run dev -- --host 127.0.0.1
```

结果：

- Astro dev server 启动到了 `http://127.0.0.1:4321/`
- 但是 Vite 依赖优化阶段报错。

遇到的问题：

```text
Cannot read directory "../../..": Access is denied.
Could not resolve "./ariaPropsMap"
Could not resolve "./helpers.js"
```

原因：

- Vite 在开发模式下会进行依赖扫描和优化。
- 当前沙盒限制导致它读取某些上级目录或依赖路径时失败。
- 这些错误不是源代码错误，而是开发服务器在沙盒环境下的权限问题。

解决办法：

- 使用提升权限重新启动 dev server。

### 8.2 提升权限后启动 dev server

```powershell
npm run dev -- --host 127.0.0.1
```

结果：

- 开发服务器成功启动。
- 由于 `4321` 端口已经被之前的尝试占用，Astro 自动切换到 `4322`。

最终本地访问地址：

```text
http://127.0.0.1:4322/
```

## 9. 页面访问验证

### 9.1 检查首页

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4322/ | Select-Object StatusCode,StatusDescription
```

结果：

```text
200 OK
```

### 9.2 检查文章页

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4322/blog/rust-programming-language/variables/ | Select-Object StatusCode,StatusDescription
```

结果：

```text
200 OK
```

### 9.3 检查文章内容

```powershell
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4322/blog/rust-programming-language/variables/).Content | Select-String -Pattern '变量|Rust|参考书' -AllMatches | Select-Object -First 8
```

结果：

- 文章页返回了完整 HTML。
- HTML 中包含 Rust 文章内容。
- PowerShell 输出中文时出现了编码显示问题，但页面 HTML 中声明了 UTF-8，浏览器正常渲染时通常不会受影响。

## 10. GitHub 同步准备情况

### 10.1 检查 `.gitignore`

```powershell
Get-Content .gitignore
```

确认已忽略：

- `dist/`
- `.astro/`
- `node_modules/`
- `.env`
- `.env.production`
- 日志文件
- 系统和 IDE 文件

这对 GitHub 同步是正确的：

- `node_modules/` 不应该提交。
- `dist/` 是构建产物，通常不需要提交，除非采用特殊部署方式。
- `.env` 不应该提交，避免泄露密钥。

### 10.2 Git 状态

```powershell
git status --short
```

结果：

```text
fatal: not a git repository (or any of the parent directories): .git
```

说明：

- 当前目录还没有初始化 Git。
- 之后要同步 GitHub，需要执行：

```powershell
git init
git add .
git commit -m "Initialize Astro blog"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 11. 当前完成结果

已经完成：

- 安装 Astro 官方博客模板。
- 安装项目依赖。
- 保留并迁移原有 Markdown 文章。
- 给文章补充 Astro frontmatter。
- 修正项目名。
- 成功运行生产构建。
- 成功启动本地开发服务器。
- 验证首页和文章页都可以访问。
- 确认 `.gitignore` 对 GitHub 同步友好。

当前可访问地址：

```text
http://127.0.0.1:4322/
```

文章地址：

```text
http://127.0.0.1:4322/blog/rust-programming-language/variables/
```

## 12. 后续建议

建议下一步做三件事：

1. 修改站点名称、作者名和简介。
   - 相关文件通常是 `src/consts.ts`、`src/components/Header.astro`、`src/components/Footer.astro`、`src/pages/about.astro`。

2. 初始化 Git 并连接 GitHub 仓库。
   - 当前目录还不是 Git 仓库。
   - 完成后就可以把博客源码同步到 GitHub。

3. 决定部署平台。
   - 常见选择：GitHub Pages、Vercel、Netlify、Cloudflare Pages。
   - 如果使用 GitHub Pages，后续可能需要根据仓库名配置 Astro 的 `site` 和 `base`。

