---
title: "法语笔记音频测试"
date: 2026-06-06
category: lang
subcategory: french
series: learning-french
seriesOrder: 2
tags:
  - french
  - audio
  - notes
lang: zh
description: "用于验收 Markdown 内嵌 HTML、french-card 样式和静态音频播放的法语笔记。"
draft: false
---

这篇文章用于验收 Phase 7：普通 Markdown 法语笔记可以直接嵌入 HTML，可以使用 `.french-card` 样式，也可以播放 `public/audio/french/` 下的静态音频。

<div class="french-card">
  <div class="french-line">Bonjour, comment allez-vous ?</div>
  <div class="gloss">你好，你好吗？</div>
  <audio controls preload="metadata" src="/audio/french/bonjour-test.wav">
    Your browser does not support the audio element.
  </audio>
</div>

Markdown 正文仍然照常书写。需要特殊排版时，只在局部使用 HTML；需要完整互动课件时，仍然使用 `public/interactive/` 的独立 HTML 页面。

<div class="french-card">
  <div class="french-line">Je parle français un peu.</div>
  <div class="gloss">我会说一点法语。</div>
</div>
