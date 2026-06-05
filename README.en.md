# Clifford Chen Blog Publishing Guide

Languages: [中文](README.md) | English | [Français](README.fr.md) | [한국어](README.ko.md)

This repository contains the source code for the blog at `cliffordchen.org` and `blog.cliffordchen.org`.

## 1. Supported Content Formats

Article content supports:

- Markdown: `.md`
- MDX: `.mdx`
- HTML snippets inside Markdown articles
- Standalone HTML pages: `.html`

Static assets support:

- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- Audio: `.mp3`, `.wav`, `.ogg`
- Other public static files, as long as they are placed under `public/`

Notes:

- Use `.md` or `.mdx` for ordinary blog posts.
- For a full interactive page, place the complete HTML file under `public/interactive/`, then link to it or embed it from a Markdown wrapper post.
- Do not use local absolute paths such as `C:\Users\1\Documents\...` inside articles. Those paths only exist on the local computer and will not work on GitHub or the server.

## 2. How To Publish A Blog Post

### Where Markdown / MDX Posts Go

Blog posts go under:

```text
src/content/posts/
```

Current top-level categories:

```text
src/content/posts/math/
src/content/posts/tech/
src/content/posts/projects/
src/content/posts/academia/
src/content/posts/lang/
src/content/posts/read/
```

For example, if you have `article.md` and want to place it under mathematics / algebra:

```text
src/content/posts/math/algebra/article.md
```

For a technical post:

```text
src/content/posts/tech/rust/article.md
```

### Markdown Post Template

Each post needs frontmatter at the top:

```md
---
title: "Post Title"
date: 2026-06-06
category: "math"
subcategory: "algebra"
series: "Algebra Ch0"
seriesOrder: 1
tags: ["math", "algebra"]
lang: "en"
description: "A short summary for search engines and post lists."
draft: false
---

Start writing the article here.
```

Field notes:

- `category` must be one of: `math`, `tech`, `projects`, `academia`, `lang`, `read`
- `lang` must be one of: `zh`, `en`, `fr`, `ko`
- `draft: true` means the post is a draft and will not be published online
- `series`, `seriesOrder`, `tags`, and `subcategory` are optional

### Where HTML Posts Go

If you have a complete interactive page named `news.html`, place it here:

```text
public/interactive/news.html
```

After deployment, the public URL path is:

```text
/interactive/news.html
```

If you also want it to appear in the blog post list, create a Markdown wrapper post:

```text
src/content/posts/projects/news.md
```

Example:

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

### Where Images Go

Images go under:

```text
public/images/
```

Example:

```text
public/images/algebra/p16.jpg
public/images/algebra/p17.jpg
```

Reference them in Markdown like this:

```md
![Algebra page 16](/images/algebra/p16.jpg)
![Algebra page 17](/images/algebra/p17.jpg)
```

Reference them in HTML like this:

```html
<img src="/images/algebra/p16.jpg" alt="Algebra page 16">
```

Do not write:

```md
![wrong](C:\Users\1\Documents\Documents\Blogs\public\images\algebra\p16.jpg)
```

Reason: `C:\Users\...` is a local computer path and will not exist on the deployed website.

### Where Audio Files Go

Audio files go under:

```text
public/audio/
```

Example:

```text
public/audio/french/bonjour.mp3
```

You can write HTML directly inside Markdown:

```html
<audio controls src="/audio/french/bonjour.mp3"></audio>
```

For a French learning card:

```html
<div class="french-card">
  <p class="french-line">Bonjour, comment allez-vous ?</p>
  <p class="gloss">Hello, how are you?</p>
  <audio controls src="/audio/french/bonjour.mp3"></audio>
</div>
```

### How Links Work

Use website paths that start with `/`:

```md
[View the French audio post](/posts/lang/french/french-note-audio-test/)
[Open the interactive page](/interactive/lecon-1.html)
```

Files under `public/` are mapped to the website root:

```text
public/images/demo.jpg        -> /images/demo.jpg
public/audio/demo.mp3         -> /audio/demo.mp3
public/interactive/demo.html  -> /interactive/demo.html
```

## 3. Publishing Commands

After writing a post, right-click inside the local blog folder and choose:

```text
Open in Terminal
```

Then copy the commands below, paste them into the terminal, and press Enter:

```powershell
git add .
git commit -m "add post xxxx"
git push
npm run deploy
```

Replace `xxxx` with a short name for the post, for example:

```powershell
git commit -m "add french lesson 2"
```

`npm run deploy` automatically syncs the site to:

```text
https://blog.cliffordchen.org/
https://cliffordchen.org/
```
