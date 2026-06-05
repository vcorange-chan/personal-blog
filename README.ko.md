# Clifford Chen Blog 게시 안내

언어: [中文](README.md) | [English](README.en.md) | [Français](README.fr.md) | 한국어

이 저장소는 `cliffordchen.org` 및 `blog.cliffordchen.org` 블로그의 소스 코드입니다.

## 1. 지원하는 콘텐츠 형식

글 콘텐츠는 다음 형식을 지원합니다.

- Markdown: `.md`
- MDX: `.mdx`
- Markdown 글 안에 직접 작성하는 HTML 조각
- 독립 HTML 페이지: `.html`

정적 파일은 다음 형식을 지원합니다.

- 이미지: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- 오디오: `.mp3`, `.wav`, `.ogg`
- 그 외 공개 정적 파일은 `public/` 아래에 두면 됩니다

주의:

- 일반 블로그 글은 `.md` 또는 `.mdx`를 권장합니다.
- 전체 페이지가 인터랙티브 HTML이라면 완성된 HTML 파일을 `public/interactive/`에 두고, 필요하면 Markdown 글에서 링크하거나 iframe으로 삽입합니다.
- 글 안에 `C:\Users\1\Documents\...` 같은 로컬 절대 경로를 쓰지 마세요. 이 경로는 로컬 컴퓨터에만 있고 GitHub나 서버에서는 동작하지 않습니다.

## 2. 블로그 글을 게시하는 방법

### Markdown / MDX 글 위치

블로그 글은 여기에 둡니다.

```text
src/content/posts/
```

현재 1차 카테고리:

```text
src/content/posts/math/
src/content/posts/tech/
src/content/posts/projects/
src/content/posts/academia/
src/content/posts/lang/
src/content/posts/read/
```

예를 들어 `article.md`를 수학 / 대수 분류에 넣고 싶다면:

```text
src/content/posts/math/algebra/article.md
```

기술 글이라면:

```text
src/content/posts/tech/rust/article.md
```

### Markdown 글 템플릿

각 글의 맨 위에는 frontmatter가 필요합니다.

```md
---
title: "글 제목"
date: 2026-06-06
category: "math"
subcategory: "algebra"
series: "Algebra Ch0"
seriesOrder: 1
tags: ["math", "algebra"]
lang: "ko"
description: "검색 엔진과 글 목록에 표시될 짧은 요약입니다."
draft: false
---

여기부터 본문을 작성합니다.
```

필드 설명:

- `category`는 반드시 `math`, `tech`, `projects`, `academia`, `lang`, `read` 중 하나여야 합니다
- `lang`은 반드시 `zh`, `en`, `fr`, `ko` 중 하나여야 합니다
- `draft: true`는 초안이며 온라인에 게시되지 않습니다
- `series`, `seriesOrder`, `tags`, `subcategory`는 필요할 때 작성합니다

### HTML 글 위치

완전한 인터랙티브 페이지 `news.html`이 있다면 여기에 둡니다.

```text
public/interactive/news.html
```

게시 후 공개 경로는 다음과 같습니다.

```text
/interactive/news.html
```

이 페이지를 블로그 글 목록에도 보이게 하려면 Markdown wrapper 글을 하나 만듭니다.

```text
src/content/posts/projects/news.md
```

예시:

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

### 이미지 위치

이미지는 여기에 둡니다.

```text
public/images/
```

예시:

```text
public/images/algebra/p16.jpg
public/images/algebra/p17.jpg
```

Markdown에서는 이렇게 참조합니다.

```md
![Algebra page 16](/images/algebra/p16.jpg)
![Algebra page 17](/images/algebra/p17.jpg)
```

HTML에서는 이렇게 참조합니다.

```html
<img src="/images/algebra/p16.jpg" alt="Algebra page 16">
```

이렇게 쓰지 마세요.

```md
![wrong](C:\Users\1\Documents\Documents\Blogs\public\images\algebra\p16.jpg)
```

이유: `C:\Users\...`는 로컬 컴퓨터 경로이므로 배포된 웹사이트에는 존재하지 않습니다.

### 오디오 파일 위치

오디오는 여기에 둡니다.

```text
public/audio/
```

예시:

```text
public/audio/french/bonjour.mp3
```

Markdown 안에 HTML을 직접 쓸 수 있습니다.

```html
<audio controls src="/audio/french/bonjour.mp3"></audio>
```

프랑스어 학습 카드 예시:

```html
<div class="french-card">
  <p class="french-line">Bonjour, comment allez-vous ?</p>
  <p class="gloss">Hello, how are you?</p>
  <audio controls src="/audio/french/bonjour.mp3"></audio>
</div>
```

### 링크 작성 방법

사이트 내부 링크는 `/`로 시작하는 경로를 사용합니다.

```md
[프랑스어 오디오 글 보기](/posts/lang/french/french-note-audio-test/)
[인터랙티브 페이지 열기](/interactive/lecon-1.html)
```

`public/` 아래 파일은 웹사이트 루트 경로로 매핑됩니다.

```text
public/images/demo.jpg        -> /images/demo.jpg
public/audio/demo.mp3         -> /audio/demo.mp3
public/interactive/demo.html  -> /interactive/demo.html
```

## 3. 게시 명령어

글을 작성한 뒤 로컬 블로그 폴더에서 우클릭하고 다음을 선택합니다.

```text
Open in Terminal
```

아래 명령어를 복사해서 터미널에 붙여넣고 Enter를 누릅니다.

```powershell
git add .
git commit -m "add post xxxx"
git push
npm run deploy
```

`xxxx`를 이번 글의 짧은 이름으로 바꿉니다. 예:

```powershell
git commit -m "add french lesson 2"
```

`npm run deploy`는 사이트를 자동으로 다음 주소에 동기화합니다.

```text
https://blog.cliffordchen.org/
https://cliffordchen.org/
```
