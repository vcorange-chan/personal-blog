# Phase 7 法语笔记与音频报告

日期：2026-06-06

## 目标

Phase 7 的目标是让法语学习笔记有一个稳定、轻量、可持续的写作模板。

清单：

- [x] 创建 `public/audio/french/`。
- [x] 支持 Markdown 中直接嵌入 HTML。
- [x] 添加 `.french-card` 样式。
- [x] 测试 `<audio controls>` 正常播放。
- [x] 用法语笔记作为验收文章之一。

## 设计判断

本轮没有重构已有的完整交互课件：

- `public/interactive/lecon-1.html`
- `src/content/posts/lang/french/lecon-1-interactive.md`

原因：

已有课件适合完整互动页面。Phase 7 的重点是补充另一种更轻量的写作方式：普通 Markdown 法语笔记中，局部使用 HTML card 和静态音频。

这样以后可以同时支持两类内容：

- 完整互动课件：放在 `public/interactive/`，通过文章 wrapper 嵌入。
- 普通法语笔记：写 Markdown，需要时局部嵌入 HTML 和 `<audio controls>`。

## 实际改动

### 1. 创建静态音频目录

目录：

```text
public/audio/french/
```

新增文件：

```text
public/audio/french/bonjour-test.wav
```

说明：

- 这是一个很短的本地 WAV 测试音频。
- 用于验证 Astro 构建时会把音频复制到 `dist/audio/french/`。
- 后续真实法语音频可以继续放在同一目录下。

### 2. 添加 `.french-card` 样式

文件：

- `src/styles/global.css`

新增样式：

- `.french-card`
- `.french-card audio`
- `.french-card .french-line`
- `.french-card .gloss`

效果：

- 法语句子有独立卡片。
- 译文或注释使用较弱视觉层级。
- `<audio controls>` 在卡片中撑满宽度。
- 暗色模式下也有适配背景和边框。

### 3. 新增法语音频验收文章

文件：

- `src/content/posts/lang/french/french-note-audio-test.md`

生成页面：

```text
/posts/lang/french/french-note-audio-test/
```

文章中验证了：

- Markdown 正文正常渲染。
- Markdown 中直接嵌入 HTML。
- `.french-card` 样式正常应用。
- `<audio controls>` 正常进入构建产物。
- 音频引用路径为：

```html
<audio controls preload="metadata" src="/audio/french/bonjour-test.wav">
```

## 使用过的命令

```powershell
Get-ChildItem -Recurse -File public | Select-Object FullName
```

用途：检查 `public/` 目录现状，确认原本没有 `audio/french`。

```powershell
New-Item -ItemType Directory -Force -Path public\audio\french
```

用途：创建静态法语音频目录。

```powershell
# 使用 .NET BinaryWriter 生成一个短 WAV 测试音频
```

用途：生成 `public/audio/french/bonjour-test.wav`，用于真正测试 `<audio controls>`，不是只放一个空路径。

遇到的问题：

- 第一次生成 WAV 时使用了 `[short]`，当前 PowerShell 环境不识别。
- 第二次尝试使用了 `??`，当前 Windows PowerShell 版本不支持。

解决：

- 改用兼容写法 `[Int16]`。
- 移除 `??`，使用普通变量和 `Join-Path`。
- 最终生成成功，文件大小为 `5644` bytes。

```powershell
npm run build
```

用途：验证 Astro 构建是否成功，并确认音频被复制到 `dist/`。

```powershell
npm run check
```

用途：验证 `astro check && biome check`。

```powershell
Select-String -Path dist\posts\lang\french\french-note-audio-test\index.html -Pattern "french-card|audio controls|bonjour-test.wav"
```

用途：确认构建产物中确实包含 `.french-card`、`audio controls` 和音频路径。

```powershell
Get-Item public\audio\french\bonjour-test.wav, dist\audio\french\bonjour-test.wav | Select-Object FullName,Length
```

用途：确认源音频和构建后的音频都存在，且文件大小一致。

## 验证结果

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 36 个页面。
- 新增文章已生成：
  - `/posts/lang/french/french-note-audio-test/`
- 新增标签页已生成：
  - `/tags/audio/`

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议未来换成正方形 icon。

这不影响 Phase 7。

### 完整检查

执行：

```powershell
npm run check
```

结果：

- `astro check`：0 errors / 0 warnings / 0 hints。
- `biome check`：通过。

### 构建产物检查

确认结果：

- `dist/posts/lang/french/french-note-audio-test/index.html` 包含 `.french-card`。
- `dist/posts/lang/french/french-note-audio-test/index.html` 包含 `<audio controls ...>`。
- `dist/posts/lang/french/french-note-audio-test/index.html` 引用了 `/audio/french/bonjour-test.wav`。
- `dist/audio/french/bonjour-test.wav` 存在。
- `public/audio/french/bonjour-test.wav` 和 `dist/audio/french/bonjour-test.wav` 大小一致，均为 `5644` bytes。

## Phase 7 状态

- [x] 创建 `public/audio/french/`。
- [x] 支持 Markdown 中直接嵌入 HTML。
- [x] 添加 `.french-card` 样式。
- [x] 测试 `<audio controls>` 正常播放。
- [x] 用法语笔记作为验收文章之一。

## 后续建议

- 后续真实法语音频建议按课程或主题命名，例如：

```text
public/audio/french/lecon-1/bonjour.mp3
public/audio/french/lecon-1/nationalite.mp3
```

- 如果静态音频越来越多，可以再建立一个音频索引文档，记录文本、文件名、来源和发音人。
- 如果某篇内容需要大量互动，仍然使用 `public/interactive/` 的完整 HTML 页面；不要把复杂交互都塞进 Markdown。
