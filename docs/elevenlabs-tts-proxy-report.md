# ElevenLabs TTS Proxy 工作报告

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`  
GitHub 仓库：`https://github.com/vcorange-chan/personal-blog`

## 1. 本次目标

用户希望博客中的法语发音使用 ElevenLabs API，因为它比浏览器自带语音更自然、更准确。

由于博客仓库是 Public，不能把 ElevenLabs API key 放在前端 HTML 或 JavaScript 中。因此本次采用用户认可的架构：

```text
Astro 静态博客
  ↓ 前端请求
VPS 上的 TTS proxy
  ↓ 使用服务器环境变量 ELEVENLABS_API_KEY
ElevenLabs API
```

目标 endpoint：

```text
https://tts.cliffordchen.org/speak
```

前端请求：

```json
{
  "text": "Bonjour, comment allez-vous ?",
  "voice": "french"
}
```

服务端返回：

```text
audio/mpeg
```

## 2. 新增 TTS proxy 服务

新增目录：

```text
tts-proxy/
```

新增文件：

```text
tts-proxy/package.json
tts-proxy/package-lock.json
tts-proxy/.env.example
tts-proxy/README.md
tts-proxy/src/server.js
```

### 2.1 安装的工具和依赖

在 `tts-proxy` 目录执行：

```powershell
npm install
```

安装结果：

```text
added 68 packages
audited 69 packages
found 0 vulnerabilities
```

核心依赖：

```text
express
```

说明：

- `node_modules/` 已被根目录 `.gitignore` 忽略，不会提交到 GitHub。
- `package-lock.json` 已生成，用于固定安装版本，方便 VPS 上复现。

### 2.2 服务端功能

服务文件：

```text
tts-proxy/src/server.js
```

实现内容：

- `GET /health`
  - 用于检查服务是否运行。

- `POST /speak`
  - 接收 `text` 和 `voice`。
  - 校验文本不能为空。
  - 限制文本长度，默认 `500` 字符。
  - 根据 `voice: "french"` 选择 `ELEVENLABS_FRENCH_VOICE_ID`。
  - 从服务器环境变量读取 `ELEVENLABS_API_KEY`。
  - 调用 ElevenLabs Text to Speech API。
  - 返回 MP3。

- CORS 白名单
  - 默认允许：

```text
https://cliffordchen.org
```

- MP3 缓存
  - 默认缓存目录：

```text
tts-proxy/.cache/audio
```

  - 相同文本和相同 voice id 会复用本地 MP3，减少 ElevenLabs 调用次数和费用。

## 3. 环境变量设计

示例文件：

```text
tts-proxy/.env.example
```

内容：

```text
PORT=8787
ELEVENLABS_API_KEY=
ELEVENLABS_DEFAULT_VOICE_ID=
ELEVENLABS_FRENCH_VOICE_ID=
ALLOWED_ORIGINS=https://cliffordchen.org,http://localhost:4321,http://127.0.0.1:4321
MAX_TEXT_LENGTH=500
CACHE_DIR=.cache/audio
```

说明：

- 真正的 `ELEVENLABS_API_KEY` 只应配置在 VPS 环境变量里。
- 不要把真实 key 写入 `.env.example`。
- 不要把真实 key 写进前端 HTML。
- 不要把真实 key commit 到 public repo。

## 4. 前端法语页面更新

修改文件：

```text
public/interactive/lecon-1.html
```

原先 Phase 2 为了安全，法语页面使用浏览器 Web Speech API 作为 fallback。

本次改为：

1. 点击发音按钮时，优先请求：

```text
https://tts.cliffordchen.org/speak
```

2. 请求体：

```json
{
  "text": "...",
  "voice": "french"
}
```

3. 如果 proxy 返回 MP3：

- 浏览器播放 ElevenLabs 音频。
- 当前页面内缓存 object URL，重复点击相同文本时不重复下载。

4. 如果 proxy 不可用：

- 自动 fallback 到浏览器 Web Speech API。
- 页面仍然可用，只是发音质量回到浏览器默认水平。

## 5. 顺手修复的问题

检查 `public/interactive/lecon-1.html` 时发现 3 个按钮存在 HTML 引号嵌套错误：

```text
onclick="speak("d'information")"
onclick="speak("l'accentuation")"
onclick="speak("comme dans l'exemple")"
```

问题原因：

- 外层 HTML 属性使用双引号。
- 内层 JavaScript 参数也误用了双引号。
- 这些按钮在浏览器中会无法正确调用 `speak()`。

解决方式：

```text
onclick="speak('d\'information')"
onclick="speak('l\'accentuation')"
onclick="speak('comme dans l\'exemple')"
```

## 6. 安全检查

执行：

```powershell
rg "sk_" public src tts-proxy docs
```

结果：

- 没有发现真实 ElevenLabs API key。
- 只在旧 report 中出现了安全检查命令本身。

还检查了：

```powershell
rg "ELEVENLABS_API_KEY|xi-api-key" public src tts-proxy docs
```

结果说明：

- `ELEVENLABS_API_KEY` 只作为环境变量名出现。
- `xi-api-key` 只在服务端 `tts-proxy/src/server.js` 中作为 ElevenLabs 请求头名出现。
- 前端 `public/interactive/lecon-1.html` 中没有 API key。

## 7. 构建与语法验证

### 7.1 TTS proxy 语法检查

执行：

```powershell
npm run check
```

结果：

```text
node --check src/server.js
```

通过。

### 7.2 Astro 静态站点构建

执行：

```powershell
npm run build
```

结果：

```text
16 page(s) built
build Complete
```

仍有旧提示：

```text
The icon(public/icon.svg) provided is not square.
```

说明：

- 这是既有 Logo 占位图问题。
- 与本次 TTS proxy 无关。
- 不影响站点构建。

## 8. VPS 部署方式

在 VPS 上可以按以下方式部署。

### 8.1 上传或拉取 repo

```bash
git clone https://github.com/vcorange-chan/personal-blog.git
cd personal-blog/tts-proxy
npm install
```

### 8.2 配置环境变量

至少需要：

```bash
export ELEVENLABS_API_KEY="你的真实 ElevenLabs API key"
export ELEVENLABS_FRENCH_VOICE_ID="你的法语 voice id"
export ALLOWED_ORIGINS="https://cliffordchen.org"
export PORT=8787
```

### 8.3 启动服务

```bash
npm start
```

### 8.4 Caddy 反向代理示例

```caddy
tts.cliffordchen.org {
  reverse_proxy 127.0.0.1:8787
}
```

然后 DNS 中添加：

```text
tts.cliffordchen.org -> VPS IP
```

## 9. 本次遇到的困难及解决办法

### 9.1 Public repo 不能保存 API key

原因：

- Astro 静态博客所有前端文件都会公开给浏览器。
- GitHub repo 也是 Public。
- API key 放在前端等于公开泄露。

解决：

- 新增 Node/Express TTS proxy。
- API key 只通过 VPS 环境变量读取。
- 前端只请求自己的 proxy。

### 9.2 静态站点不能直接安全调用 ElevenLabs

原因：

- 静态站点没有私密服务端运行环境。
- 浏览器请求 ElevenLabs 必须携带 key，而这个 key 会被任何访问者看到。

解决：

- Astro 继续保持静态博客。
- TTS 作为独立后端服务部署在 VPS。

### 9.3 ElevenLabs 调用可能产生费用

原因：

- 每次生成语音都可能消耗额度。

解决：

- 在 proxy 中增加本地 MP3 缓存。
- 对相同模型、voice id、文本生成 hash。
- 命中缓存时直接返回已有 MP3。

### 9.4 法语 HTML 中存在少量按钮语法问题

原因：

- HTML 属性双引号和 JavaScript 字符串双引号冲突。

解决：

- 改成安全的单引号调用，并转义法语撇号。

## 10. 当前状态

已完成：

- 新增 `tts-proxy` Node/Express 服务。
- 新增 `.env.example`。
- 新增 VPS 部署说明。
- 法语交互页已改为优先调用 ElevenLabs TTS proxy。
- proxy 不可用时保留 Web Speech API fallback。
- TTS proxy 语法检查通过。
- Astro build 通过。
- 没有提交真实 ElevenLabs API key。

尚未完成：

- VPS 上真实部署服务。
- 配置 `tts.cliffordchen.org` DNS。
- 配置真实 `ELEVENLABS_API_KEY`。
- 配置真实 `ELEVENLABS_FRENCH_VOICE_ID`。

这些步骤需要在用户的 VPS 和域名 DNS 面板中执行。

