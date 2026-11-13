# 博客修复与手机管理后台

日期：2026-11-13（Australia/Brisbane）。

## 本次需求与设计边界

仅 Clifford 本人管理内容；未来可能有多个站点。目前只有网页和本机发布两个入口。付费、定时发布不实现，也不引入账号数据库。网页通过 GitHub 本人账号登录，内容以 GitHub main 分支为准，两个入口复用 `scripts/deploy-blog.mjs`，目标列表仍集中保存在该文件。

## 服务检查

通过已有 SSH alias 只读检查两台 VPS：

- Seoul：Caddy、tts-proxy active；根分区 50%，剩余约 12 GB；TTS 仅监听 127.0.0.1:8787。
- Sydney：Caddy、sing-box active；根分区 36%，剩余约 19 GB；SSH 22022、代理 TCP 8443、HTTPS 443 监听正常。
- Seoul 还发现 xray 监听 9443；本次未调整该现有服务。
- 本次没有发送付费 ElevenLabs 合成请求；active 状态与健康检查不能代替真实语音合成验收。

## 数学公式

文件：`src/content/posts/math/algebra/counting-theorem-intuition.md`。

原因：原文使用 `\(...\)`、`\[...\]`，当前 remark-math 使用 `$...$`、`$$...$$`。Markdown 会先处理反斜杠，导致原始公式以普通文字显示。另有两处 `\text{...}` 内嵌套数学定界符。

修复：规范数学定界符、修正两处嵌套，保留原文论证与行间距 `\\[2mm]`。`src/layouts/BlogPost.astro` 给正文 flex 子项补上 `min-w-0`，允许宽公式在自身区域滚动。

浏览器验收：390px、1440px，KaTeX 错误节点为 0，行内公式超过 50 个、块级公式超过 20 个，整页无横向溢出。另保存亮色和暗色截图到本机 `artifacts/release-2026-11-13/`（不进 Git）。

## 英语界面

- `src/layouts/Base.astro`：移除 UI 翻译脚本。
- `src/components/layout/Header.astro`：移除语言切换，保留主题切换和移动导航。
- 删除 `UiLanguageProvider.astro`、`LanguageSwitch.astro`。
- 站点 HTML 和评论界面为英语；浏览器语言和旧 localStorage 偏好不再改变 UI。
- `src/content/config.ts`：正文语言元数据接受通用语言代码，默认 en；文章本身不翻译。保留内容语言标签和已有筛选路由，不再建立多语言 UI。

## 内容

从 `C:\Users\1\Documents\AiWorkSpace\MathDaily\DailyUnderstanding` 导入唯一的 `define_topology.md`。

目标：`src/content/posts/math/topology/define-topology.md`；补齐 frontmatter，保留正文、原记录和更新时间。路由：`/posts/math/topology/define-topology/`。

按用户要求删除 6 篇文章：

1. `src/content/posts/academia/reviews/reading-note-template.md`
2. `src/content/posts/lang/french/french-note-audio-test.md`
3. `src/content/posts/lang/french/lecon-1-interactive.md`
4. `src/content/posts/math/algebra/math-code-typesetting-test.md`
5. `src/content/posts/read/待办待读的项目和书籍文章.md`
6. `src/content/posts/tech/game-engine/what-is-a-game-engine.md`

同时删除法语课程的 `public/interactive/lecon-1.html`，避免文章删除后仍能从直接链接访问。Git 历史保留旧文件，可以恢复；未删除不确定是否共用的图片或音频。

## 手机管理入口

入口：https://blog.cliffordchen.org/admin/

采用 Decap CMS 3.17.3，自托管浏览器脚本，无需手机安装工具。依据：[Decap GitHub backend](https://decapcms.org/docs/github-backend/)、[嵌套目录配置](https://decapcms.org/docs/collection-nested/)。

- `src/pages/admin.astro`：管理页、手机布局、禁止索引。
- `public/admin/config.yml`：仓库、嵌套文章目录、完整 frontmatter 字段与媒体上传设置。
- `public/admin/editor.js`：Markdown 文件导入控件。导入正文，frontmatter 信息需在表单中核对填写。
- `public/admin/bootstrap.js`：从 Sydney 的管理入口跳转至 Seoul，确保 OAuth origin 一致。
- `public/admin/decap-cms.js`：固定版本第三方包；SHA256 `B96249532AB219C5A78B57ED4AC05EB92E6446819AC217CED6F81318A0D98E70`。下载地址：`https://unpkg.com/decap-cms@3.17.3/dist/decap-cms.js`。
- `astro.config.ts`：后台不进 sitemap，robots 排除 /admin/ 和 /cms/。
- `tsconfig.json`、`biome.json`、`.prettierignore`：第三方大型浏览器包不参加源码类型分析或格式化，防止无意义的内存耗尽。

### 发布与删除

1. 用手机或电脑打开管理入口，点击 Login with GitHub，使用 `vcorange-chan` 登录并授权。
2. Posts → 新建 Post，选择目录，例如 math/topology，填写标题、日期、分类等。
3. Markdown：在 Body 的 Import Markdown 选择文件，或直接编辑。核对元数据后 Publish。
4. HTML：在 HTML document 字段上传完整 `.html`，Layout 选择 immersive；Body 可以留空。
5. 图片、音频通过 Media 上传，文件保存在 `public/uploads/`，文章使用 `/uploads/文件名`，不要使用 Windows 绝对路径。
6. 删除：打开文章，使用编辑器的 Delete 操作并确认；删除媒体前先确认其他文章没有引用。
7. 发布后到 https://github.com/vcorange-chan/personal-blog/actions 查看部署结果。绿色表示流程完成，红色需打开失败日志；GitHub 已保存不代表网站已完成部署。

完整 HTML 通过 iframe 展示；`src/content/config.ts` 增加可选 interactiveFile，`BlogPost.astro` 提供 sandbox iframe。允许脚本和弹出链接，不赋予与主站同源的权限，保护主站存储与后台令牌。依赖同源存储或特殊浏览器权限的 HTML 需要另行调整。

手机保存之后，本机旧副本可能落后。下一次在本机编辑前运行 `git pull --ff-only`；若本地有未提交更改，先保存或提交，再处理同步，避免覆盖手机发布的文章。

## 登录服务与服务器改动

新服务 `blog-cms.service`，只部署 Seoul：

- 代码：仓库 `cms-auth/server.mjs` → VPS `/opt/blog-cms/server.mjs`。
- 配置：`/etc/blog-cms.env`，权限 600，用户手动写入 GitHub Client ID 与 Secret。Secret 不进入 Git。
- 仅监听 `127.0.0.1:8790`，Caddy 代理 `/cms/*`。
- DynamicUser、NoNewPrivileges、ProtectSystem=strict、ProtectHome、128MB 内存上限；无 sudo 或仓库写入权限。
- OAuth 使用随机 state + HttpOnly/Secure/SameSite cookie，10 分钟过期、一次性使用，回调核对 GitHub 用户。
- 只允许 `vcorange-chan`，OAuth 请求 public_repo 范围，令牌仅发往固定后台 origin。
- GitHub 访问令牌由 Decap 在登录浏览器管理；公共电脑使用后应退出后台，也可从 GitHub 撤销 OAuth 应用授权。
- Caddy 为 /admin/ 添加强制 CSP、no-store、noindex 和禁止嵌套响应头；正文保留已有 CSP-Report-Only。

安装：`node scripts/install-cms.mjs`。配置代理脚本：`scripts/configure-blog-cms.py`。修改前保存 `Caddyfile.before-blog-cms`，验证失败自动恢复，只 reload Caddy。

安全单元测试：`node --test cms-auth/server.test.mjs`，覆盖伪造请求、重复 state、合法 owner 和非 owner。

## 自动部署

`.github/workflows/publish.yml`：main 分支 push 或手动触发 → npm ci → npm run check → npm run deploy，复用本机双 VPS 部署脚本。生产工作流串行运行，避免工作流之间重叠。

新增 GitHub Actions Secrets：BLOG_SEOUL_SSH_KEY、BLOG_SYDNEY_SSH_KEY、BLOG_SSH_KNOWN_HOSTS。用户已明确授权创建两把独立 SSH 密钥。authorized_keys 使用 restrict，禁用端口转发、PTY 等；仍具备 clifford 账号的远程命令权限，应保护仓库写权限和工作流文件。

`scripts/setup-ci-deploy.mjs` 是一次性凭据配置工具，默认发布无需再运行。脚本生成临时密钥，保存到 GitHub Secrets 后删除本机临时文件，不输出私钥；重复运行会新增密钥，不要作为日常部署命令。

撤销方法：从各 VPS 的 ~/.ssh/authorized_keys 删除注释为 blog-actions-web-vps 或 blog-actions-vps 的对应公钥，并删除 GitHub Secrets；不要删除原有个人 SSH 公钥。

当前工作流串行约束不覆盖手动执行的本机部署。后台保存后等 Actions 完成，再使用本机部署。

## 验收记录

- Astro 检查 0 errors / 0 warnings / 0 hints；Biome 通过；构建产生 55 个页面。
- 首轮本机双 VPS 部署成功；最终版本通过新增 GitHub Actions 流程再次部署并验收。
- 手机后台使用内存 test-repo 后端验证新增文章与 Markdown 文件导入，不向真实仓库发布测试内容。
- 遇到并修复：第三方大包参与类型分析导致内存耗尽（排除 vendor 包）；手机预览 CSS 误隐藏表单（移除错误选择器）；新后台静态目录在 Astro dev 不自动路由（改用 admin.astro）；服务重启后立即检查连接失败（等待启动后重试）。
- OAuth 登录必须由本人在浏览器完成 GitHub 授权；模拟安全测试不能替代本人首次登录确认。
- `docs/infrastructure-reference.md` 是此前遗留的未提交文件，本次没有将其加入提交。
