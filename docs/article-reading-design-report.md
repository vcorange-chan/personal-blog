# 文章阅读页排版调整

日期：2026-11-13。

## 范围与设计约定

用户选择只修改文章阅读页，参考所提供的 Boxes 页面截图：淡黄绿色纸张、大号衬线标题、日期在上、单栏正文、统一图文宽度、细虚线和舒展留白。

共用边界：所有文章仍使用同一 BlogPost 模板；新排版通过 Base 的 readingPage 开关启用，样式以 html.reading-page 为边界。更多文章自动复用；首页、列表、About、Academia、后台和发布流程不改。保留暗色模式、原文语言、公式、代码、评论、目录和交互 HTML。没有新账号、付费、服务端功能或发布入口。

## 文件位置

- `src/layouts/Base.astro`：新增可选 readingPage，默认 false，不改变其他页面的行为。
- `src/layouts/BlogPost.astro`：文章开启 readingPage；单栏正文；为 article 设置正文语言；引入专属样式。保留宽屏交互 HTML。
- `src/components/blog/Masthead.astro`：日期在标题上方，标题使用衬线字体；作者、阅读时长、语言、更新日期和标签使用低调的文字排版。
- `src/components/blog/TOC.astro`：目录默认折叠，去掉占据正文宽度的桌面侧栏。
- `src/styles/reading-page.css`：专属背景与暗色配色、左右细虚线、标题字号与留白、正文和媒体排版、窄屏约束。没有修改 global.css。
- `public/fonts/eb-garamond-latin.woff2`：自托管 EB Garamond 5.3.0 拉丁字符可变字体；许可证在同目录 `eb-garamond-LICENSE.txt`。来源：`@fontsource-variable/eb-garamond@5.3.0/files/eb-garamond-latin-wght-normal.woff2`。

英语正文采用系统无衬线字体，接近截图；中文保留楷体优先 fallback。中文实际字体取决于设备已安装的字体；标题拉丁字符使用自托管字体，不依赖外部 CDN。代码和 KaTeX 保留各自字体。

## 复现与验收

1. `npm run check` 检查类型和代码格式。
2. `npm run build` 构建静态文件。
3. `npm run dev -- --host 127.0.0.1 --port 4321` 本机预览。
4. `scripts/verify-reading-design.mjs` 在本机 Edge / Playwright 环境检查 320、390、768、1440px；英语、中文、公式、代码、目录展开、暗色模式与首页样式隔离。
5. 截图保存在 `artifacts/reading-design/`，不进入 Git；可直接人工检查拓扑笔记、Counting Theorem 和 Julia 文章。

现有 GitHub main 自动部署流程仍负责两台 VPS；本机和网页上传的文章使用相同模板，不需要逐篇迁移。

## 验证结果

- Astro 检查：64 个文件，0 errors / 0 warnings / 0 hints；Biome 73 个文件通过。
- 320、390、768、1440px：英文与中文标题完整、日期与正文对齐、公式无 KaTeX 错误、正文无整页横向溢出。
- 目录可展开/折叠；暗色背景切换到预期颜色后截图检查；原有英语交互 HTML 的 iframe 宽度、高度与页面边界通过检查。
- 首页不含 reading-page 开关，原来的 768px 页面宽度保持不变。
- 截图已人工查看英语标题、中文标题、代码与暗色模式。首页、后台等页面不采用文章的新配色或字体规则。
