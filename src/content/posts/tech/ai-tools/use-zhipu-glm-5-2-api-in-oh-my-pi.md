---
title: "怎样在 Oh-my-pi 中使用智谱 GLM-5.2 API"
date: 2026-06-22
category: tech
subcategory: ai-tools
tags:
  - zhipu
  - glm
  - oh-my-pi
  - api
  - powershell
  - coding-agent
lang: zh
description: "记录如何在 Windows PowerShell 环境下，通过自定义 OpenAI-compatible provider，把智谱 GLM-5.2 普通 API 配置到 Oh-my-pi 中。"
draft: false
---

## 背景

Oh-my-pi 是一个终端里的 AI Coding Agent，可以在本地项目中帮助我们阅读代码、分析项目、修改文件和执行开发任务。

不过在实际配置智谱模型时，有一个容易混淆的地方：

**Oh-my-pi 默认提供的是智谱 / Z.AI 的 Coding Plan 接入选项，而不是普通 GLM 模型 API 的登录入口。**

也就是说，如果你在 Oh-my-pi 里使用 `/login`，你看到的通常是 Coding Plan 相关选项，而不是普通的 GLM-5.2 API Key 登录方式。

如果你已经在智谱开放平台申请了普通的 GLM-5.2 API Key，那么不需要走 Oh-my-pi 的 Coding Plan 登录，而是要自己在 Oh-my-pi 的模型配置文件中添加一个自定义 OpenAI-compatible provider。

本文记录如何在 Windows PowerShell 环境下，把智谱 GLM-5.2 普通 API 配置到 Oh-my-pi 中。

## 一、准备工作

你需要已经完成以下几件事：

1. 已安装 Oh-my-pi；
2. 已经可以在终端中运行：

```powershell
omp
```

3. 已经在智谱开放平台获取 GLM-5.2 的 API Key；
4. 不要把 API Key 发给别人，也不要写进公开仓库。

智谱 GLM-5.2 普通 API 的接口地址是：

```text
https://open.bigmodel.cn/api/paas/v4/chat/completions
```

但是在 Oh-my-pi 的配置文件中，`baseUrl` 不要写完整的 `/chat/completions`，只需要写到：

```text
https://open.bigmodel.cn/api/paas/v4
```

因为 Oh-my-pi 会自己拼接后面的路径。

## 二、先测试智谱 API Key 是否可用

在配置 Oh-my-pi 之前，建议先用 PowerShell 测试 API Key 是否能正常调用 GLM-5.2。

打开 PowerShell，先设置你的 API Key：

```powershell
$key = "你的智谱API_KEY"
```

注意：这里替换成你自己的真实 API Key。不要把它粘贴到公开地方。

然后运行：

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $key"
}

$body = @{
  model = "glm-5.2"
  messages = @(
    @{
      role = "user"
      content = "你好，请回复：GLM API 正常"
    }
  )
  thinking = @{
    type = "enabled"
  }
  max_tokens = 1024
  temperature = 1.0
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "https://open.bigmodel.cn/api/paas/v4/chat/completions" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

如果返回中出现类似：

```text
model      : glm-5.2
object     : chat.completion
usage      : ...
```

或者返回了模型回复，就说明 API Key、账户权限和接口地址都是正常的。

如果出现 `401`、`unauthorized`、`invalid api key` 之类错误，说明 API Key 或账户权限有问题，需要先去智谱开放平台检查。

## 三、创建 Oh-my-pi 模型配置文件

Oh-my-pi 的自定义模型配置文件位于：

```text
C:\Users\你的用户名\.omp\agent\models.yml
```

在 PowerShell 中运行：

```powershell
mkdir $env:USERPROFILE\.omp\agent -Force
notepad $env:USERPROFILE\.omp\agent\models.yml
```

如果记事本提示文件不存在，选择创建即可。

## 四、添加 GLM-5.2 配置

在 `models.yml` 中写入以下内容：

```yaml
providers:
  zhipu:
    baseUrl: https://open.bigmodel.cn/api/paas/v4
    apiKey: "你的智谱API_KEY"
    api: openai-completions
    models:
      - id: glm-5.2
        name: GLM-5.2
        contextWindow: 1000000
        maxTokens: 65536
```

请把：

```yaml
apiKey: "你的智谱API_KEY"
```

替换成你自己的真实 API Key。

这里有几个重点：

### 1. `baseUrl` 不要加 `/chat/completions`

正确写法：

```yaml
baseUrl: https://open.bigmodel.cn/api/paas/v4
```

错误写法：

```yaml
baseUrl: https://open.bigmodel.cn/api/paas/v4/chat/completions
```

因为 Oh-my-pi 会自动拼接 `/chat/completions`。

### 2. 不要使用 Coding Plan 地址

普通 GLM-5.2 API 使用：

```text
https://open.bigmodel.cn/api/paas/v4
```

不要写成：

```text
https://open.bigmodel.cn/api/coding/paas/v4
```

后者是 Coding Plan 相关接口，不是普通 GLM API 的接入方式。

### 3. API Key 不需要改成 `id.secret`

智谱开放平台现在提供的 API Key 可以直接整串使用。

不要自己拆分，不要自己加点号，也不要改成旧教程里提到的 `id.secret` 格式。

## 五、重启 Oh-my-pi 并选择模型

保存 `models.yml` 后，重新打开 PowerShell，进入你的项目目录：

```powershell
cd 你的项目目录
omp
```

进入 Oh-my-pi 后，输入：

```text
/model
```

在模型列表中找到类似：

```text
GLM-5.2
zhipu / glm-5.2
```

选择它。

选中后，界面上可能会显示类似：

```text
[M] GLM-5.2 - [high]
ctx: 2.6%/1M
```

这说明 Oh-my-pi 已经切换到了 GLM-5.2。

## 六、测试是否连接成功

在 Oh-my-pi 中输入：

```text
请回复：GLM-5.2 已经连接成功。不要修改任何文件。
```

如果模型回复：

```text
GLM-5.2 已经连接成功。
```

就说明配置成功。

## 七、常见问题

### 问题 1：PowerShell 里直接复制智谱官网的 curl 命令报错

智谱官网给出的 curl 示例通常是 Linux / macOS / Git Bash 风格，例如：

```bash
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{...}'
```

这个命令在 Windows PowerShell 中可能会报错，因为：

1. PowerShell 里的 `curl` 可能是 `Invoke-WebRequest` 的别名；
2. PowerShell 不使用 `\` 作为换行符；
3. PowerShell 的 JSON 引号转义方式和 bash 不一样。

因此，在 PowerShell 中更推荐使用 `Invoke-RestMethod`，也就是本文第二部分给出的测试方式。

### 问题 2：`/model` 里看不到 GLM-5.2

可以检查配置文件是否真的保存成功：

```powershell
type $env:USERPROFILE\.omp\agent\models.yml
```

确认内容里有：

```yaml
providers:
  zhipu:
    baseUrl: https://open.bigmodel.cn/api/paas/v4
```

还要检查 YAML 缩进是否正确。YAML 对缩进很敏感，不能乱加空格，也不能把层级写平。

### 问题 3：API Key 测试成功，但 Oh-my-pi 调用失败

这种情况通常是 `models.yml` 配置问题。重点检查：

1. `baseUrl` 是否写成了完整的 `/chat/completions`；
2. `api` 是否写成了 `openai-completions`；
3. `apiKey` 是否完整；
4. YAML 缩进是否正确；
5. 是否保存后重新启动了 Oh-my-pi。

## 八、推荐使用方式

第一次在项目中使用时，建议不要直接让模型修改文件，而是先让它只读项目：

```text
请只阅读项目，不要修改文件。总结项目结构、运行方式、主要依赖和可能风险。
```

确认模型工作正常后，再让它处理具体任务，例如修复 bug、解释代码、补充测试或重构函数。

## 总结

Oh-my-pi 默认提供的智谱相关入口更偏向 Coding Plan，而普通 GLM-5.2 API 不一定会出现在 `/login` 中。

如果你想在 Oh-my-pi 中使用智谱开放平台的普通 GLM-5.2 API，需要手动配置：

```text
C:\Users\你的用户名\.omp\agent\models.yml
```

核心配置如下：

```yaml
providers:
  zhipu:
    baseUrl: https://open.bigmodel.cn/api/paas/v4
    apiKey: "你的智谱API_KEY"
    api: openai-completions
    models:
      - id: glm-5.2
        name: GLM-5.2
        contextWindow: 1000000
        maxTokens: 65536
```

配置完成后，重启 Oh-my-pi，使用 `/model` 选择 GLM-5.2，即可在 Oh-my-pi 中调用智谱 GLM-5.2 普通 API。
