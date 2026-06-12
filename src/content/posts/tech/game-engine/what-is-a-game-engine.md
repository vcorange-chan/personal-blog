---
title: "游戏引擎是什么？"
date: 2026-06-12
category: tech
subcategory: game-engine
tags:
  - game-engine
  - defold
  - flutter
  - learning-notes
lang: zh
description: "用 Flutter 框架作类比，解释游戏引擎是什么，以及 Defold 适合做什么类型的游戏。"
draft: false
---

做一个 App 不是从零写起。你用 Flutter 框架，它帮你处理按钮怎么渲染、动画怎么跑、手势怎么识别。

游戏引擎就是**做游戏用的“框架”**，它帮你处理：

- 画面怎么每秒刷新 60 次
- 两个物体碰撞了怎么检测
- 角色怎么响应键盘或触摸输入
- 声音怎么播放
- 物理重力怎么模拟

如果没有游戏引擎，你要自己用 C++ 从头写这些，基本不可能一个人完成一个游戏。

## Defold 具体能做什么游戏

它最擅长的是这类：

- **手机休闲游戏**：消消乐、跑酷、塔防
- **网页小游戏**：直接在浏览器里跑，不用下载
- **2D 独立游戏**：像素风、横版闯关

不适合做的：

- 3D 大型游戏，那是 Unreal / Unity 的地盘
- 需要超复杂物理效果的游戏

## 做一个游戏实际上要做什么

以一个最简单的“小鸟飞过管道”，也就是 Flappy Bird，作为例子，你需要：

### 1. 美术资源

小鸟的图片、管道的图片、背景图。可以自己画，也可以网上找免费素材。

### 2. 游戏逻辑

Defold 主要用 Lua 写游戏逻辑。

```lua
-- 每一帧更新小鸟的位置
function update(self, dt)
  self.velocity = self.velocity - gravity * dt -- 重力让小鸟下坠
  move_bird(self.velocity) -- 更新位置
end

-- 玩家点击屏幕
function on_input(self, action)
  if action.pressed then
    self.velocity = jump_force -- 点一下往上飞
  end
end
```

### 3. 碰撞检测

Defold 自动帮你检测小鸟有没有碰到管道。碰到了以后，你写“游戏结束”的逻辑。

### 4. 发布

一键打包成 Android APK、iOS 包，或者网页版。

## 跟你熟悉的 Flutter 类比

|        | Flutter | Defold |
| --- | --- | --- |
| 做什么 | App | 游戏 |
| 核心语言 | Dart | Lua |
| 基本单位 | Widget，组件 | GameObject，游戏对象 |
| 画面更新 | 事件驱动 | 每帧循环，每秒 60 次 |
| 物理/碰撞 | 基本没有 | 内置 |

Flutter 是“用户点了按钮，触发事件，更新界面”。

Defold 是“每秒跑 60 次循环，每次都问：现在角色在哪？有没有碰撞？该播什么动画？”

这就是游戏和 App 最本质的区别。
