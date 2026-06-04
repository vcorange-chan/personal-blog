# Phase 1：Astro Cactus 主题迁移工作报告

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`  
GitHub 仓库：`https://github.com/vcorange-chan/personal-blog`  
目标域名：`https://cliffordchen.org`

## 1. Phase 1 目标

本阶段目标是把当前 Astro starter 项目迁移到 **Astro Cactus** 主题，并完成基础项目整理：

- 引入 Astro Cactus 主题。
- 检查 Cactus 当前 Astro 版本兼容性。
- 安装/保留必要依赖：Astro、KaTeX、代码高亮、MD/MDX 支持。
- 清理默认示例文章和默认站点信息。
- 保留已有 Rust 文章，并迁移到 Cactus 内容结构中。

本阶段不做：

- 评论系统 giscus。
- Umami 统计。
- VPS 部署。
- 完整分类页、子分类页、系列页架构。
- 字体和配色最终决策。

这些留给后续 Phase。

## 2. 已确认的 Phase 0 决策

本阶段执行时遵守以下已确认决策：

- 主题使用：Astro Cactus。
- GitHub repo 继续使用：`vcorange-chan/personal-blog`。
- repo 保持 Public。
- 绑定域名：`cliffordchen.org`。
- 用户最终通过 `https://cliffordchen.org` 访问博客。

## 3. 初始检查

### 3.1 检查 Git 状态

```powershell
git status --short --branch
```

结果：

```text
## main...origin/main
```

说明：

- 开始 Phase 1 前，本地 `main` 和远程 `origin/main` 同步。
- 工作区干净。

### 3.2 检查当前项目

```powershell
Get-ChildItem -Force
Get-Content package.json
Get-ChildItem -Recurse -File src\content
```

检查结果：

- 当前项目是之前用 Astro 官方 blog starter 初始化的项目。
- Astro 版本为 `^6.4.4`。
- 已有文章位于：

```text
src/content/blog/rust-programming-language/variables.md
```

## 4. 下载并检查 Astro Cactus

### 4.1 使用官方 create astro 拉取 Cactus 模板

```powershell
npm create astro@latest cactus-temp -- --template chrismwilliams/astro-theme-cactus --install --no-git
```

说明：

- 使用 handoff 指定的 Cactus 主题来源：`chrismwilliams/astro-theme-cactus`。
- 先安装到临时目录 `cactus-temp`，不直接覆盖当前项目。
- 这样可以先检查主题结构和依赖，再迁移。

### 4.2 模板安装过程中的提示

脚手架最后出现过：

```text
error Error: Timeout
Dependencies failed to install, please run npm install to install them manually after setup.
```

但同时模板目录已经生成，且 `node_modules` 存在。

处理方式：

- 没有直接信任这个矛盾状态。
- 手动检查了 `cactus-temp/package.json`、`cactus-temp/src/` 和 `node_modules`。
- 后续迁移后重新运行 `npm install`，用当前项目自己的 lockfile 和依赖目录作为最终状态。

### 4.3 Cactus 版本与 Astro 版本

检查命令：

```powershell
Get-Content cactus-temp\package.json
```

关键结果：

```json
{
  "version": "7.2.0",
  "dependencies": {
    "astro": "6.3.3",
    "@astrojs/mdx": "5.0.6",
    "@astrojs/rss": "4.0.18",
    "@astrojs/sitemap": "3.7.2",
    "astro-expressive-code": "^0.42.0"
  }
}
```

判断：

- Cactus 当前模板版本是 `7.2.0`。
- 它固定 Astro 为 `6.3.3`。
- 虽然本地旧 starter 是 Astro `^6.4.4`，但我没有升级 Cactus 的 Astro 主版本或小版本。
- 原因是 handoff 明确提醒：如果 Cactus 有版本兼容风险，应跟随 Cactus 指定版本，而不是擅自升级。

## 5. 迁移主题文件

### 5.1 备份旧文章

```powershell
New-Item -ItemType Directory -Force -Path '.phase1-backup' | Out-Null
Copy-Item -LiteralPath 'src\content\blog\rust-programming-language\variables.md' -Destination '.phase1-backup\variables.md'
```

目的：

- 在替换 `src/` 之前，先保存已有 Rust 文章。
- 防止主题迁移时误删用户内容。

### 5.2 替换项目骨架

迁移时删除了旧 Astro starter 的主要文件：

- `src/`
- `public/`
- `.vscode/`
- `.astro/`
- `dist/`
- `node_modules/`
- `astro.config.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `tsconfig.json`

然后从 Cactus 临时目录复制：

- `src/`
- `public/`
- `.vscode/`
- `.editorconfig`
- `.gitignore`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc.js`
- `astro.config.ts`
- `biome.json`
- `LICENSE`
- `package.json`
- `README.md`
- `tailwind.config.ts`
- `tsconfig.json`

保留了：

- `.git/`
- `docs/`

### 5.3 遇到的 Windows 文件锁问题

第一次删除旧 `node_modules` 时失败，报错示例：

```text
Cannot remove item ... esbuild.exe: Access to the path is denied.
Cannot remove item ... sharp-win32-x64.node: Access to the path is denied.
Cannot remove item ... rollup.win32-x64-msvc.node: Access to the path is denied.
```

原因：

- 之前启动的 Astro dev server 仍在运行。
- Windows 会锁住 `esbuild`、`sharp`、`rollup` 这类二进制文件。
- 被进程占用时，PowerShell 无法删除这些文件。

检查命令：

```powershell
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path,StartTime
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Select-Object ProcessId,CommandLine
```

确认结果：

- 存在 4 个 Node 进程。
- 命令行显示它们都是之前的 `npm run dev` / `astro dev`。

解决命令：

```powershell
taskkill /PID 4412 /PID 18880 /PID 18452 /PID 13224 /F
```

之后重新删除 `node_modules` 成功：

```powershell
Remove-Item -Recurse -Force -LiteralPath 'node_modules'
```

## 6. 清理默认功能和默认内容

### 6.1 删除 Cactus 默认示例内容

执行清理：

```powershell
Remove-Item -Recurse -Force -LiteralPath 'src\content\post','src\content\note','src\pages\notes','src\components\note','src\content\tag\test.md','src\components\Search.astro','src\styles\blocks\search.css'
```

删除内容包括：

- Cactus 默认 post 示例文章。
- Cactus note 内容和 note 页面。
- 默认 tag 示例文件。
- Search 组件。
- Search CSS。

原因：

- handoff 明确要求第一版不要复杂搜索。
- Notes 不是本项目已确定的信息架构。
- 默认文章会干扰真实内容结构。

### 6.2 移除 Pagefind 搜索依赖

从 `package.json` 删除：

- `@pagefind/component-ui`
- `@pagefind/default-ui`
- `pagefind`
- `postbuild: pagefind --site dist`

原因：

- Pagefind 属于搜索功能。
- handoff 明确说初期不要复杂搜索。
- 第一版应降低维护负担。

### 6.3 移除 Webmentions

删除：

```text
src/components/blog/webmentions/
src/utils/webmentions.ts
```

并从 `astro.config.ts` 移除 Webmention env 配置。

原因：

- 评论系统后续按 giscus 做。
- Webmentions 是 Cactus 默认带的外部交互功能，不在本项目 Phase 1 范围内。

## 7. 站点基础信息修改

修改文件：

```text
src/site.config.ts
```

关键修改：

```typescript
url: "https://cliffordchen.org/",
title: "Clifford Chen",
author: "Clifford Chen",
description: "Personal blog and notes by Clifford Chen.",
lang: "en",
ogLocale: "en_US",
```

导航修改为：

```text
Home
About
Posts
```

说明：

- 已移除默认的 `Astro Cactus` 站点名。
- 已移除 `Notes` 导航。
- Tagline 仍未最终确定，后续需要 Clifford 提供或选择。

## 8. 文章迁移

### 8.1 新文章路径

旧路径：

```text
src/content/blog/rust-programming-language/variables.md
```

新路径：

```text
src/content/post/tech/rust/variables.md
```

当前访问路径：

```text
/posts/tech/rust/variables/
```

说明：

- Cactus 当前使用 `post` collection。
- Phase 1 为了保持主题可运行，暂时保留 Cactus 内部 collection 名 `post`。
- 文章 frontmatter 已改为 handoff 目标字段。
- Phase 2 再继续做完整的 `posts` collection、分类页、子分类页和系列页。

### 8.2 新 frontmatter

```yaml
---
title: 'Rust 变量和可变性'
description: '关于 Rust 变量、可变性、内存地址与类型解释规则的学习笔记。'
date: 2026-05-25
category: tech
subcategory: rust
series: rust-learning
seriesOrder: 1
tags:
  - rust
  - variables
lang: zh
draft: false
---
```

## 9. 内容 Schema 调整

修改文件：

```text
src/content.config.ts
```

Cactus 默认字段包括：

- `publishDate`
- `coverImage`
- `ogImage`
- `pinned`

本阶段已改为更接近 handoff 的字段：

- `title`
- `description`
- `date`
- `category`
- `subcategory`
- `series`
- `seriesOrder`
- `tags`
- `lang`
- `draft`

保留：

- `updatedDate`
- `pinned`

说明：

- `updatedDate` 是 Cactus 文章页已有支持，保留不影响写作。
- `pinned` 是 Cactus 首页已有机制，暂时保留；后续如果严格执行 schema 时可在 Phase 2 移除。
- collection 名仍暂时是 `post`，不是最终 handoff 中的 `posts`。

## 10. KaTeX 与代码高亮

### 10.1 安装 KaTeX 支持

新增依赖：

```json
{
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.1"
}
```

修改 `astro.config.ts`：

```typescript
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
```

并加入：

```typescript
remarkPlugins: [remarkReadingTime, remarkMath, remarkDirective, remarkGithubCard, remarkAdmonitions],
rehypePlugins: [..., rehypeKatex, ...]
```

验证结果：

- Rust 文章中的 `$42$` 已被渲染为 `.katex` HTML 结构。

### 10.2 代码高亮

Cactus 使用：

```text
astro-expressive-code
```

说明：

- handoff 中说代码高亮用 Shiki。
- `astro-expressive-code` 底层使用 Shiki 生态进行高亮，且是 Cactus 默认方案。
- 因此 Phase 1 保留 Cactus 的代码高亮方案，没有改回 Astro starter 的默认代码块。

## 11. 安装依赖

迁移后执行：

```powershell
npm install
```

结果：

```text
added 600 packages, and audited 601 packages in 2m
5 moderate severity vulnerabilities
```

处理判断：

- npm 提示可以 `npm audit fix --force`。
- 我没有执行。
- 原因是 `--force` 可能升级或替换 Cactus 依赖版本，破坏主题兼容性。

## 12. 构建问题与解决

### 12.1 第一次构建

```powershell
npm run build
```

遇到问题：

```text
[@tailwindcss/vite:generate:build] Missing field `tsconfigPaths` on BindingViteResolvePluginConfig.resolveOptions
```

原因：

- Cactus `package.json` 使用 `@tailwindcss/vite: 4.3.0` 和 `tailwindcss: 4.3.0`。
- npm 实际安装后出现 Vite 版本混装：

```text
astro@6.3.3 -> vite@7.3.5
@tailwindcss/vite@4.3.0 -> vite@8.0.16
```

- 这个组合在 build 阶段触发 Vite/Rolldown 绑定兼容错误。

解决方式：

```powershell
npm install @tailwindcss/vite@4.1.17 tailwindcss@4.1.17 @tailwindcss/typography@0.5.19
```

判断：

- 不升级 Astro。
- 只把 Tailwind 相关依赖降到更稳的 4.1 系列。
- 这是对 Cactus/Astro 版本兼容性的最小修正。

### 12.2 第二次构建

Tailwind 问题解决后，出现新错误：

```text
Cannot read properties of undefined (reading 'toISOString')
```

位置：

```text
/og-image/tech/rust/variables.png
```

原因：

- Cactus OG image 生成器仍在读取旧字段 `publishDate`。
- 我们已经把文章字段改成 `date`。

解决方式：

- 修改 `src/pages/og-image/[...slug].png.ts`
- 把 `publishDate` 改为 `date`
- 把 `pubDate` 变量改为 `date`

### 12.3 RSS 日期字段修正

同样把 RSS 中的：

```typescript
pubDate: post.data.publishDate
```

改为：

```typescript
pubDate: post.data.date
```

## 13. 构建验证

最终执行：

```powershell
npm run build
```

结果：

```text
01:27:07 [build] 8 page(s) built in 3.37s
01:27:07 [build] Complete!
```

生成的关键页面：

```text
/index.html
/posts/index.html
/posts/tech/rust/variables/index.html
/rss.xml
/tags/index.html
/tags/rust/index.html
/tags/variables/index.html
```

非致命提示：

```text
No files found matching "**/*.{md,mdx}" in directory "src\content\tag"
The collection "tag" does not exist or is empty.
The icon(public/icon.svg) provided is not square.
```

解释：

- `tag` metadata 为空，但 tag 页面仍能生成。
- Phase 1 没有设计 logo，所以 Cactus 默认 `icon.svg` 不是正方形的提示暂时保留。
- 这些不阻止构建和访问。

## 14. 本地开发服务器验证

启动命令：

```powershell
npm run dev -- --host 127.0.0.1
```

结果：

```text
astro  v6.3.3 ready
Local  http://127.0.0.1:4321/
```

Astro 提醒：

```text
New version of Astro available: 6.4.4
```

处理判断：

- 不升级。
- 继续使用 Cactus 指定的 Astro `6.3.3`。

### 14.1 页面 HTTP 验证

首页：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321/
```

结果：

```text
200 OK
```

文章页：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321/posts/tech/rust/variables/
```

结果：

```text
200 OK
```

RSS：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321/rss.xml
```

结果：

```text
200 OK
```

### 14.2 浏览器验证说明

我尝试使用 Codex 内置浏览器打开本地页面，但当前 Windows 沙盒里的 browser runtime 启动失败：

```text
windows sandbox failed: spawn setup refresh
```

因此本轮使用本地 HTTP 请求和 HTML 内容检查完成验证。

## 15. 当前完成状态

已经完成：

- 引入 Astro Cactus 主题。
- 检查并遵守 Cactus 指定的 Astro `6.3.3`。
- 迁移项目骨架到 Cactus。
- 安装 Cactus 依赖。
- 移除 Pagefind Search。
- 移除 Notes。
- 移除 Webmentions。
- 清理 Cactus 默认示例文章。
- 设置站点为 `Clifford Chen` 和 `https://cliffordchen.org/`。
- 迁移已有 Rust 文章。
- 文章 frontmatter 改为目标字段。
- 配置 KaTeX。
- 保留 Cactus/Expressive Code 代码高亮。
- 修复 Tailwind/Vite 构建兼容问题。
- 修复 OG image/RSS 旧日期字段问题。
- 构建成功。
- 本地 dev server 页面访问成功。

## 16. 当前遗留事项

这些不属于 Phase 1 或需要 Clifford 决策：

1. Tagline 未最终确定。
2. 字体组合未最终确定。
3. 配色方案未最终确定。
4. Logo 未最终确定。
5. `tag` metadata 集合为空，构建时有提示。
6. `public/icon.svg` 不是正方形，webmanifest 生成时有提示。
7. content collection 名仍是 Cactus 的 `post`，Phase 2 应改向最终 `posts` 架构。
8. 分类页、子分类页、系列页、Academia 专属页尚未实现。
9. giscus、Umami、deploy.sh 尚未开始。

## 17. Phase 1 结论

Phase 1 已完成。

当前项目已经从默认 Astro blog starter 迁移为 Astro Cactus 基础主题，并保留了已有 Rust 文章。项目可以构建，也可以本地访问。

当前本地访问地址：

```text
http://127.0.0.1:4321/
```

当前文章地址：

```text
http://127.0.0.1:4321/posts/tech/rust/variables/
```

