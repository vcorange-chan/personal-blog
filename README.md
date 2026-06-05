# Clifford Chen Blog 发布说明

语言：中文 | [English](README.en.md) | [Français](README.fr.md) | [한국어](README.ko.md)

这个仓库是 `cliffordchen.org` / `blog.cliffordchen.org` 的博客源码。

## 1. 博客内容支持哪些文件格式

文章内容支持：

- Markdown：`.md`
- MDX：`.mdx`
- Markdown 文章里直接写 HTML 片段
- 独立 HTML 页面：`.html`

静态资源支持：

- 图片：`.jpg`、`.jpeg`、`.png`、`.gif`、`.webp`、`.svg`
- 音频：`.mp3`、`.wav`、`.ogg`
- 其他可公开访问的静态文件：放在 `public/` 下面即可

注意：

- 普通博客文章建议用 `.md` 或 `.mdx`。
- 如果是一整页强交互内容，建议把完整 HTML 放到 `public/interactive/`，再用一篇 Markdown 文章链接或嵌入它。
- 不要在文章里使用本机绝对路径，例如 `C:\Users\1\Documents\...`。这些路径只在你的电脑上存在，GitHub 和网站服务器都找不到。

## 2. 怎样发布博客文章

### Markdown / MDX 文章放哪里

博客文章放在：

```text
src/content/posts/
```

当前分类目录：

```text
src/content/posts/math/
src/content/posts/tech/
src/content/posts/projects/
src/content/posts/academia/
src/content/posts/lang/
src/content/posts/read/
```

例如你有一篇 `article.md`，想放在数学/代数分类：

```text
src/content/posts/math/algebra/article.md
```

例如你有一篇技术文章：

```text
src/content/posts/tech/rust/article.md
```

### Markdown 文章模板

每篇文章开头需要 frontmatter：

```md
---
title: "文章标题"
date: 2026-06-06
category: "math"
subcategory: "algebra"
series: "Algebra Ch0"
seriesOrder: 1
tags: ["math", "algebra"]
lang: "zh"
description: "这是一句给搜索引擎和文章列表看的摘要。"
draft: false
---

这里开始写正文。
```

字段说明：

- `category` 必须是：`math`、`tech`、`projects`、`academia`、`lang`、`read`
- `lang` 必须是：`zh`、`en`、`fr`、`ko`
- `draft: true` 表示草稿，不发布到线上
- `series`、`seriesOrder`、`tags`、`subcategory` 可以按需要填写

### HTML 博文放哪里

如果你有一个完整交互页面 `news.html`，放在：

```text
public/interactive/news.html
```

上线后访问路径是：

```text
/interactive/news.html
```

如果你希望它也出现在博客文章列表中，建议再创建一篇 Markdown 包装文章：

```text
src/content/posts/projects/news.md
```

内容示例：

```md
---
title: "News Interactive Page"
date: 2026-06-06
category: "projects"
subcategory: "interactive"
tags: ["html", "interactive"]
lang: "en"
description: "An interactive HTML page."
layout: "immersive"
draft: false
---

<iframe src="/interactive/news.html" title="News Interactive Page" style="width: 100%; min-height: 80vh; border: 0;"></iframe>
```

### 图片放哪里

图片放在：

```text
public/images/
```

例如：

```text
public/images/algebra/p16.jpg
public/images/algebra/p17.jpg
```

Markdown 里这样引用：

```md
![Algebra page 16](/images/algebra/p16.jpg)
![Algebra page 17](/images/algebra/p17.jpg)
```

HTML 里这样引用：

```html
<img src="/images/algebra/p16.jpg" alt="Algebra page 16">
```

不要这样写：

```md
![wrong](C:\Users\1\Documents\Documents\Blogs\public\images\algebra\p16.jpg)
```

原因：`C:\Users\...` 是你本机路径，网站上线后不存在。

### 音频放哪里

音频放在：

```text
public/audio/
```

例如：

```text
public/audio/french/bonjour.mp3
```

Markdown 里可以直接写 HTML：

```html
<audio controls src="/audio/french/bonjour.mp3"></audio>
```

如果要放在法语卡片里：

```html
<div class="french-card">
  <p class="french-line">Bonjour, comment allez-vous ?</p>
  <p class="gloss">Hello, how are you?</p>
  <audio controls src="/audio/french/bonjour.mp3"></audio>
</div>
```

### 链接怎么写

站内链接使用以 `/` 开头的网站路径：

```md
[查看法语音频文章](/posts/lang/french/french-note-audio-test/)
[打开互动页面](/interactive/lecon-1.html)
```

图片、音频、HTML 都从 `public/` 映射到网站根路径：

```text
public/images/demo.jpg        -> /images/demo.jpg
public/audio/demo.mp3         -> /audio/demo.mp3
public/interactive/demo.html  -> /interactive/demo.html
```

## 3. 发布命令

写完文章后，在本地博客文件夹中右键，选择：

```text
Open in Terminal
```

然后复制下面命令，粘贴到终端，回车：

```powershell
git add .
git commit -m "add post xxxx"
git push
npm run deploy
```

把 `xxxx` 改成这次文章的大概名字，例如：

```powershell
git commit -m "add french lesson 2"
```

`npm run deploy` 会自动同步到：

```text
https://blog.cliffordchen.org/
https://cliffordchen.org/
```
