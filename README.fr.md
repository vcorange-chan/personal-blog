# Guide de publication du blog Clifford Chen

Langues : [中文](README.md) | [English](README.en.md) | Français | [한국어](README.ko.md)

Ce dépôt contient le code source du blog publié sur `cliffordchen.org` et `blog.cliffordchen.org`.

## 1. Formats de contenu pris en charge

Les articles peuvent utiliser :

- Markdown : `.md`
- MDX : `.mdx`
- Des fragments HTML directement dans un article Markdown
- Des pages HTML autonomes : `.html`

Les fichiers statiques pris en charge :

- Images : `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- Audio : `.mp3`, `.wav`, `.ogg`
- Autres fichiers publics, à condition de les placer dans `public/`

Notes :

- Pour un article ordinaire, utilisez plutôt `.md` ou `.mdx`.
- Pour une page entièrement interactive, placez le fichier HTML complet dans `public/interactive/`, puis créez éventuellement un article Markdown qui le lie ou l'intègre.
- N'utilisez pas de chemin absolu local comme `C:\Users\1\Documents\...` dans un article. Ce chemin n'existe que sur l'ordinateur local et ne fonctionnera pas sur GitHub ni sur le serveur.

## 2. Comment publier un article

### Où placer les articles Markdown / MDX

Les articles vont dans :

```text
src/content/posts/
```

Catégories principales actuelles :

```text
src/content/posts/math/
src/content/posts/tech/
src/content/posts/projects/
src/content/posts/academia/
src/content/posts/lang/
src/content/posts/read/
```

Par exemple, pour placer `article.md` dans mathématiques / algèbre :

```text
src/content/posts/math/algebra/article.md
```

Pour un article technique :

```text
src/content/posts/tech/rust/article.md
```

### Modèle d'article Markdown

Chaque article doit commencer par un frontmatter :

```md
---
title: "Titre de l'article"
date: 2026-06-06
category: "math"
subcategory: "algebra"
series: "Algebra Ch0"
seriesOrder: 1
tags: ["math", "algebra"]
lang: "fr"
description: "Un court résumé pour les moteurs de recherche et les listes d'articles."
draft: false
---

Commencez l'article ici.
```

Remarques sur les champs :

- `category` doit être l'un de : `math`, `tech`, `projects`, `academia`, `lang`, `read`
- `lang` doit être l'un de : `zh`, `en`, `fr`, `ko`
- `draft: true` signifie que l'article est un brouillon et ne sera pas publié
- `series`, `seriesOrder`, `tags` et `subcategory` sont optionnels

### Où placer les articles HTML

Si vous avez une page interactive complète nommée `news.html`, placez-la ici :

```text
public/interactive/news.html
```

Après publication, le chemin public sera :

```text
/interactive/news.html
```

Si vous voulez aussi l'afficher dans la liste des articles, créez un article Markdown enveloppe :

```text
src/content/posts/projects/news.md
```

Exemple :

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

### Où placer les images

Les images vont dans :

```text
public/images/
```

Exemple :

```text
public/images/algebra/p16.jpg
public/images/algebra/p17.jpg
```

Dans Markdown :

```md
![Algebra page 16](/images/algebra/p16.jpg)
![Algebra page 17](/images/algebra/p17.jpg)
```

Dans HTML :

```html
<img src="/images/algebra/p16.jpg" alt="Algebra page 16">
```

N'écrivez pas :

```md
![wrong](C:\Users\1\Documents\Documents\Blogs\public\images\algebra\p16.jpg)
```

Raison : `C:\Users\...` est un chemin local et n'existe pas sur le site déployé.

### Où placer les fichiers audio

Les fichiers audio vont dans :

```text
public/audio/
```

Exemple :

```text
public/audio/french/bonjour.mp3
```

Vous pouvez écrire du HTML directement dans Markdown :

```html
<audio controls src="/audio/french/bonjour.mp3"></audio>
```

Pour une carte de français :

```html
<div class="french-card">
  <p class="french-line">Bonjour, comment allez-vous ?</p>
  <p class="gloss">Hello, how are you?</p>
  <audio controls src="/audio/french/bonjour.mp3"></audio>
</div>
```

### Comment écrire les liens

Utilisez des chemins de site qui commencent par `/` :

```md
[Voir l'article audio en français](/posts/lang/french/french-note-audio-test/)
[Ouvrir la page interactive](/interactive/lecon-1.html)
```

Les fichiers dans `public/` sont exposés à la racine du site :

```text
public/images/demo.jpg        -> /images/demo.jpg
public/audio/demo.mp3         -> /audio/demo.mp3
public/interactive/demo.html  -> /interactive/demo.html
```

## 3. Commandes de publication

Après avoir écrit un article, faites un clic droit dans le dossier local du blog et choisissez :

```text
Open in Terminal
```

Copiez ensuite les commandes ci-dessous, collez-les dans le terminal, puis appuyez sur Entrée :

```powershell
git add .
git commit -m "add post xxxx"
git push
npm run deploy
```

Remplacez `xxxx` par un court nom pour l'article, par exemple :

```powershell
git commit -m "add french lesson 2"
```

`npm run deploy` synchronise automatiquement le site vers :

```text
https://blog.cliffordchen.org/
https://cliffordchen.org/
```
