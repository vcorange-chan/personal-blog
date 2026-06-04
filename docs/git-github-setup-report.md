# Git 初始化与 GitHub 仓库连接工作报告

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`  
GitHub 仓库：`https://github.com/vcorange-chan/personal-blog`

## 1. 任务目标

本次任务的目标是把本地 Astro 博客项目初始化为 Git 仓库，并连接到 GitHub 仓库 `vcorange-chan/personal-blog`，最终把本地代码推送到 GitHub 的 `main` 分支。

## 2. 初始检查

在正式操作前，我先检查了当前目录是否已经是 Git 仓库，以及是否已经配置远程仓库。

### 2.1 检查是否在 Git 仓库中

```powershell
git rev-parse --is-inside-work-tree
```

结果：

```text
fatal: not a git repository (or any of the parent directories): .git
```

说明：

- 当前 `Blogs` 文件夹还没有初始化 Git。
- 目录中不存在有效的 `.git` 仓库配置。

### 2.2 检查 Git 状态

```powershell
git status --short
```

结果：

```text
fatal: not a git repository (or any of the parent directories): .git
```

说明：

- 因为还没有执行 `git init`，所以无法查看工作区状态。

### 2.3 检查远程仓库配置

```powershell
git remote -v
```

结果：

```text
fatal: not a git repository (or any of the parent directories): .git
```

说明：

- 当前还没有本地 Git 仓库，因此也没有配置任何远程仓库。

## 3. 初始化本地 Git 仓库

### 3.1 执行 Git 初始化

```powershell
git init
```

结果：

```text
Initialized empty Git repository in C:/Users/1/Documents/Documents/Blogs/.git/
```

说明：

- Git 在当前博客目录创建了 `.git` 文件夹。
- 从这一刻开始，当前目录成为一个本地 Git 仓库。

### 3.2 检查待提交文件

```powershell
git status --short
```

结果中显示了待提交文件，例如：

```text
?? .gitignore
?? .vscode/
?? README.md
?? astro.config.mjs
?? docs/
?? package-lock.json
?? package.json
?? public/
?? src/
?? tsconfig.json
```

检查重点：

- 没有看到 `node_modules/`
- 没有看到 `dist/`
- 没有看到 `.astro/`

说明：

- `.gitignore` 已经生效。
- 依赖目录、构建产物和 Astro 临时文件不会被提交到 GitHub。

## 4. 连接 GitHub 远程仓库

目标远程仓库地址：

```text
https://github.com/vcorange-chan/personal-blog.git
```

### 4.1 第一次添加远程仓库

```powershell
git remote add origin https://github.com/vcorange-chan/personal-blog.git
```

遇到的问题：

```text
error: could not lock config file .git/config: Permission denied
fatal: could not set 'remote.origin.url' to 'https://github.com/vcorange-chan/personal-blog.git'
```

原因：

- `git remote add` 需要写入 `.git/config`。
- 当前运行环境对 `.git/config` 的写入权限受限。
- 这不是 GitHub 地址错误，而是本地 Git 配置文件写入权限问题。

解决办法：

- 使用提升权限重新执行远程仓库添加命令。

### 4.2 提升权限后再次添加远程仓库

```powershell
git remote add origin https://github.com/vcorange-chan/personal-blog.git
```

遇到的新问题：

```text
fatal: detected dubious ownership in repository at 'C:/Users/1/Documents/Documents/Blogs'
'C:/Users/1/Documents/Documents/Blogs/.git' is owned by:
    维C橙的DELL/CodexSandboxOffline
but the current user is:
    维C橙的DELL/1
```

原因：

- `.git` 仓库最初是在 Codex 沙盒用户下创建的。
- 提升权限后，Git 操作变成了 Windows 用户 `1`。
- Git 检测到仓库所有者和当前操作用户不同，于是触发安全保护。
- 这是 Git 的 `safe.directory` 安全机制，用来防止在不可信目录中执行 Git 操作。

解决办法：

把当前博客目录加入 Git 的安全目录白名单：

```powershell
git config --global --add safe.directory C:/Users/1/Documents/Documents/Blogs
```

### 4.3 添加 safe.directory 后再次添加远程仓库

```powershell
git remote add origin https://github.com/vcorange-chan/personal-blog.git
```

结果：

- 命令成功。
- 本地仓库成功连接到 GitHub 远程仓库。

## 5. 暂存和提交项目文件

### 5.1 第一次暂存文件

```powershell
git add .
```

遇到的问题：

```text
fatal: Unable to create 'C:/Users/1/Documents/Documents/Blogs/.git/index.lock': Permission denied
```

原因：

- `git add` 需要写入 `.git/index`。
- 当前 `.git` 目录仍然存在写入权限限制。

解决办法：

- 使用提升权限执行 `git add .`。

### 5.2 提升权限后暂存文件

```powershell
git add .
```

结果：

- 文件成功暂存。
- Git 输出了一批换行符提示：

```text
warning: in the working copy of '...', LF will be replaced by CRLF the next time Git touches it
```

原因：

- 当前系统是 Windows。
- Git 的换行符配置可能会把文本文件中的 LF 换行转换成 CRLF。

影响：

- 这只是换行符提示，不影响提交。
- 如果以后想统一跨平台换行规则，可以添加 `.gitattributes`。

### 5.3 创建初始提交

```powershell
git commit -m "Initialize Astro blog"
```

结果：

```text
[master (root-commit) 6f8042c] Initialize Astro blog
 39 files changed, 7651 insertions(+)
```

说明：

- 成功创建了第一次提交。
- 提交哈希为：`6f8042c`
- 提交信息为：`Initialize Astro blog`
- 本次提交包含 Astro 项目文件、文章内容和工作报告文档。

## 6. 设置主分支为 main

Git 初始化后的默认分支名是 `master`，而 GitHub 当前常用默认分支名是 `main`。

因此执行：

```powershell
git branch -M main
```

结果：

- 本地分支名从 `master` 改为 `main`。

## 7. 推送到 GitHub

### 7.1 第一次推送

```powershell
git push -u origin main
```

遇到的问题：

```text
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/vcorange-chan/personal-blog.git/'
```

原因：

- GitHub 已经不支持用账号密码进行 HTTPS Git 推送。
- HTTPS 推送需要下面任意一种认证方式：
  - Git Credential Manager 浏览器登录
  - Personal Access Token
  - SSH key

解决办法：

- 检查本机是否安装 GitHub CLI。
- 发现没有安装 GitHub CLI。
- 然后改用 Git Credential Manager。

### 7.2 检查 GitHub CLI

```powershell
gh --version
```

结果：

```text
gh : The term 'gh' is not recognized as the name of a cmdlet...
```

说明：

- 当前环境没有安装 GitHub CLI。
- 无法使用 `gh auth login` 登录 GitHub。

### 7.3 检查 Git Credential Manager

```powershell
git credential-manager --version
```

结果：

```text
2.7.3+5fa7116896c82164996a609accd1c5ad90fe730a
```

说明：

- Git Credential Manager 已安装。
- 可以用它处理 GitHub HTTPS 登录。

### 7.4 检查 credential.helper 配置

```powershell
git config --global credential.helper
```

结果：

- 没有输出。

说明：

- Git 还没有配置凭据助手。
- 这也是第一次推送没有顺利触发登录流程的原因之一。

### 7.5 配置 Git Credential Manager

```powershell
git credential-manager configure
```

结果：

```text
Configuring component 'Git Credential Manager'...
Configuring component 'Azure Repos provider'...
```

说明：

- Git Credential Manager 已配置为 Git 凭据助手。
- 后续 HTTPS 推送可以通过它完成 GitHub 登录和凭据保存。

### 7.6 第二次推送

```powershell
git push -u origin main
```

结果：

```text
To https://github.com/vcorange-chan/personal-blog.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

说明：

- 本地 `main` 分支成功推送到 GitHub。
- GitHub 上创建了新的 `main` 分支。
- 本地 `main` 已设置为跟踪远程 `origin/main`。

## 8. 最终检查

### 8.1 检查远程仓库地址

```powershell
git remote -v
```

结果：

```text
origin  https://github.com/vcorange-chan/personal-blog.git (fetch)
origin  https://github.com/vcorange-chan/personal-blog.git (push)
```

说明：

- 远程仓库 `origin` 配置正确。

### 8.2 检查分支和工作区状态

```powershell
git status --short --branch
```

结果：

```text
## main...origin/main
```

说明：

- 当前分支是 `main`。
- 本地 `main` 正在跟踪远程 `origin/main`。
- 没有未提交的文件，工作区是干净的。

### 8.3 检查最后一次提交

```powershell
git log --oneline -1
```

结果：

```text
6f8042c Initialize Astro blog
```

说明：

- 最新提交就是本次 Astro 博客初始化提交。
- 该提交已经推送到 GitHub。

## 9. 当前完成结果

已经完成：

- 初始化本地 Git 仓库。
- 确认 `.gitignore` 生效，没有提交 `node_modules/`、`dist/`、`.astro/`。
- 连接 GitHub 仓库：`vcorange-chan/personal-blog`。
- 处理 Git 仓库所有权安全提示。
- 处理 `.git` 写入权限问题。
- 配置 Git Credential Manager。
- 创建初始提交：`6f8042c Initialize Astro blog`。
- 将本地 `main` 分支成功推送到 GitHub。

当前 GitHub 仓库：

```text
https://github.com/vcorange-chan/personal-blog
```

当前本地 Git 状态：

```text
## main...origin/main
```

## 10. 后续建议

建议下一步做三件事：

1. 添加 `.gitattributes` 统一换行符。
   - 这样可以减少 Windows 上的 `LF will be replaced by CRLF` 提示。

2. 修改 Astro 站点信息后再提交。
   - 比如站点标题、作者名、社交链接、About 页面。
   - 修改后执行：

```powershell
git add .
git commit -m "Customize blog profile"
git push
```

3. 配置部署。
   - 如果使用 GitHub Pages，需要根据仓库和部署方式配置 Astro。
   - 如果使用 Vercel、Netlify 或 Cloudflare Pages，通常连接 GitHub 仓库后设置构建命令 `npm run build`，输出目录 `dist`。

