# Phase 4plus 首页导航与可访问性清理报告

日期：2026-06-06

## 目标

本轮 Phase 4plus 根据 Phase 4 后的反馈继续做三件事：

- 顶栏导航入口过多，改成更紧凑的 `Explore` 菜单。
- 清理 `public/interactive/lecon-1.html` 的按钮可访问性问题，让 `npm run check` 能全仓库通过。
- 明确未来 i18n 方向：可以翻译站点 UI，但博客文章正文保持原样，不自动翻译。

## 实际改动

### 1. 顶栏分类收进 Explore 菜单

文件：

- `src/components/layout/Header.astro`
- `src/site.config.ts`

改动：

- `menuLinks` 现在只保留主要入口：
  - `Home`
  - `About`
  - `Posts`
  - `Series`
- 新增 `exploreLinks`：
  - `Math`
  - `Tech`
  - `Lang`
  - `Academia`
- Header 中新增 `Explore` 按钮。
- 点击 `Explore` 后显示分类菜单。
- 移动端也通过同一个按钮展开分类入口，减少顶栏挤压。

原因：

Phase 4 后顶栏入口较多，桌面端还能接受，但移动端容易显得拥挤。把分类收进 `Explore` 菜单后，顶栏更像一个长期可维护的博客导航。

### 2. 清理法语交互页按钮可访问性

文件：

- `public/interactive/lecon-1.html`

改动：

- 给所有缺少类型的按钮补上：

```html
type="button"
```

检查前：

- 缺少 `type` 的 `<button>` 数量：255

检查后：

- 缺少 `type` 的 `<button>` 数量：0

原因：

HTML 中 `<button>` 默认类型是 `submit`。虽然当前页面不在表单中，但显式写 `type="button"` 更安全，也符合可访问性和 lint 要求。

### 3. 清理法语交互页脚本提示

文件：

- `public/interactive/lecon-1.html`

改动：

- 把字符串拼接改成 template literal：

```js
`TTS proxy returned ${response.status}`
```

- 把语音查找条件改成 optional chain：

```js
voice.lang?.toLowerCase().startsWith("fr")
```

- 增加：

```js
window.speak = speak;
```

原因：

`speak()` 是给页面上的内联按钮 `onclick="speak(...)"` 调用的。Biome 无法从内联 HTML 事件里判断函数被使用，所以显式挂到 `window` 上，让代码意图更清楚。

### 4. 格式化旧文件

文件：

- `astro.config.ts`
- `scripts/deploy-blog.mjs`
- `src/utils/date.ts`
- `tts-proxy/src/server.js`

改动：

- 使用 Biome 自动格式化。
- 整理 import 顺序。
- 折行较长语句。

原因：

这些文件本身不是 Phase 4plus 的功能改动对象，但 `npm run check` 会检查全仓库。为了让完整检查通过，需要按 Biome 当前规则格式化这些旧文件。

## 关于 i18n 的决定

目前语言入口仍然是“按内容语言筛选”，例如 `/languages/zh/`。

未来如果做完整 i18n，原则如下：

- 可以翻译站点 UI：
  - 导航
  - 首页标题
  - 按钮
  - 分类名称
  - 系统提示
- 不翻译博客文章正文。
- 文章内容保持作者写作时的原始语言。
- 如果同一主题有不同语言版本，应作为不同文章存在，而不是自动翻译同一篇文章。

这个原则可以避免误译数学、编程、学术内容，也保留每篇文章的写作语境。

## 使用过的命令

```powershell
git status --short
```

用途：确认 Phase 4 已经提交，当前工作区从干净状态开始。

```powershell
Select-String -Path public\interactive\lecon-1.html -Pattern "<button(?![^>]*\stype=)" | Measure-Object
```

用途：统计缺少 `type` 的按钮数量。

```powershell
npm run build
```

用途：验证 Astro 静态构建是否成功。

```powershell
npm run check
```

用途：运行完整检查：

```text
astro check && biome check
```

```powershell
npx biome check --write ...
```

用途：对旧文件应用 Biome 安全修复和格式化。

```powershell
git diff --stat
```

用途：查看本轮改动涉及哪些文件，以及改动规模。

## 验证结果

### 完整检查

执行：

```powershell
npm run check
```

结果：

- `astro check` 通过。
- `biome check` 通过。
- 59 个文件检查完成。
- 无错误、无警告。

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 30 个页面。

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议未来换成正方形 icon。

这不影响 Phase 4plus 功能，也不影响构建成功。

## 改动文件清单

- `src/components/layout/Header.astro`
  - 新增 `Explore` 菜单。
  - 分类入口从顶栏直列改为下拉菜单。

- `src/site.config.ts`
  - 新增 `exploreLinks`。
  - 主导航保留高频入口。

- `public/interactive/lecon-1.html`
  - 255 个按钮补 `type="button"`。
  - 清理 TTS 脚本 lint 提示。

- `astro.config.ts`
  - Biome 格式化与 import 排序。

- `scripts/deploy-blog.mjs`
  - Biome 格式化。

- `src/utils/date.ts`
  - Biome 格式化。

- `tts-proxy/src/server.js`
  - Biome 格式化。

## Phase 4plus 状态

- [x] 顶栏分类入口收进 `Explore` 菜单。
- [x] 法语交互 HTML 的按钮补 `type="button"`。
- [x] `npm run check` 全仓库通过。
- [x] `npm run build` 构建通过。
- [x] 记录未来 i18n 原则：只翻译 UI，不翻译博客正文。
