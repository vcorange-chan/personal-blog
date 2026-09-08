---
title: "使用Julia语言，实现范畴箭头"
date: 2026-09-08
category: math
subcategory: algebra
series: algebra-ch0
seriesOrder: 3
tags:
  - algebra
  - category-theory
  - julia
  - programming
lang: zh
description: "使用 Julia 的参数化结构体表示范畴中的抽象箭头，并理解 Symbol、String、类型参数、domain 与 codomain。"
draft: false
---

范畴可以看作一种带有公理约束的抽象数据结构：它包含对象、对象之间的箭头、恒等箭头，以及箭头的复合运算。本文先完成最小的一步——使用 Julia 表示一条带有名称、定义域和陪域的抽象箭头。

## 定义 Arrow 数据结构

```julia
struct Arrow{O}
    name::Symbol
    dom::O
    cod::O
end
```

`Arrow` 是这个数据类型的名称。花括号中的 `O` 是类型参数，表示我们使用什么 Julia 类型来表示对象。这里的 `O` 是大写字母 O，而不是数字 0。

结构体包含三个字段：

- `name` 是箭头的名称，并被限定为 `Symbol` 类型；
- `dom` 是箭头的 domain，即定义域或起点；
- `cod` 是箭头的 codomain，即陪域或终点。

字段声明中的 `::` 是 Julia 的类型标注语法：

```julia
name::Symbol
dom::O
cod::O
```

它表示 `name` 必须是 `Symbol` 类型的值，而 `dom` 和 `cod` 必须是类型 `O` 的值。

需要特别区分：`O` 是类型参数，并不是某个具体对象。例如，当 `O = Symbol` 时，`:X` 和 `:Y` 才是类型为 `Symbol` 的具体对象标签。

## 构造两个箭头

```julia
struct Arrow{O}
    name::Symbol
    dom::O
    cod::O
end

f = Arrow(:f, :X, :Y)
g = Arrow(:g, "X", "Y")

println(typeof(f))
println(typeof(g))
println(f)
println(g)
```

在 PowerShell 中运行：

```powershell
julia .\Arrow.jl
```

输出为：

```text
Arrow{Symbol}
Arrow{String}
Arrow{Symbol}(:f, :X, :Y)
Arrow{String}(:g, "X", "Y")
```

## 第一个箭头：使用 Symbol 表示对象

```julia
f = Arrow(:f, :X, :Y)
```

在 Julia 中，前置冒号用来创建一个 `Symbol` 值：

```julia
:f
:X
:Y
```

分别等价于：

```julia
Symbol("f")
Symbol("X")
Symbol("Y")
```

由于 `:X` 和 `:Y` 都是 `Symbol`，Julia 推断类型参数为

```julia
O = Symbol
```

因此：

```julia
typeof(f) == Arrow{Symbol}
```

这个值记录了一条名为 `:f` 的抽象箭头：

$$
f:X\longrightarrow Y.
$$

更精确地说：程序使用 Symbol 值 `:X`、`:Y` 作为两个数学对象的标签。

## 第二个箭头：使用 String 表示对象

```julia
g = Arrow(:g, "X", "Y")
```

箭头名称 `:g` 仍然是 `Symbol`，但定义域和陪域使用了字符串：

```julia
typeof("X") == String
typeof("Y") == String
```

所以 Julia 推断：

```julia
O = String
typeof(g) == Arrow{String}
```

这个值记录了一条名为 `:g`、以字符串 `"X"` 和 `"Y"` 作为对象标签的抽象箭头：

$$
g:\texttt{"X"}\longrightarrow\texttt{"Y"}.
$$

## Symbol、String 和 Char

下面三个 Julia 表达式具有不同的类型：

```julia
:X       # Symbol
"X"      # String
'X'      # Char
```

因此：

```julia
Arrow(:f, :X, :Y)      # Arrow{Symbol}
Arrow(:g, "X", "Y")    # Arrow{String}
Arrow(:h, 'X', 'Y')    # Arrow{Char}
```

冒号并不是 `Arrow` 构造器语法的一部分。它只是创建 `Symbol` 的 Julia 语法。下面两种写法等价：

```julia
Arrow(:f, :X, :Y)
Arrow(Symbol("f"), Symbol("X"), Symbol("Y"))
```

也可以先把它们保存在变量中：

```julia
arrow_name = :f
domain = :X
codomain = :Y

f = Arrow(arrow_name, domain, codomain)
```

## Arrow{O} 是一族类型

`struct Arrow{O}` 定义的不是单个具体类型，而是一族参数化类型：

```julia
Arrow{Symbol}
Arrow{String}
Arrow{Char}
Arrow{Int64}
```

可以把它类比为其他语言中的泛型 `Arrow<O>`。同一条结构定义能够使用多种方式表示范畴中的对象，同时要求一条箭头的 `dom` 和 `cod` 使用同一种表示类型。

例如：

```julia
integer_arrow = Arrow(:k, 1, 2)

println(typeof(integer_arrow))
# Arrow{Int64}
```

这里整数 `1` 和 `2` 只是两个对象的标签。

## 当前结构表示的是抽象箭头，而不是函数

需要注意：

```julia
Arrow(:f, :X, :Y)
```

只记录了：

- 箭头的名称；
- 箭头的起点；
- 箭头的终点。

它没有说明某个输入元素应当如何映射为输出元素。因此，它表示的是范畴中的抽象 morphism，而不一定是一个 Julia 函数。

如果我们要表示函数范畴中的具体映射，可以增加一个 `map` 字段：

```julia
struct FunctionArrow{O,F}
    name::Symbol
    dom::O
    cod::O
    map::F
end

double = FunctionArrow(:double, :Int, :Int, x -> 2x)

println(double.map(5))
# 10
```

这里 `F` 是实际函数的类型参数，`map` 保存具体的计算规则。

## 小结

最初的定义：

```julia
struct Arrow{O}
    name::Symbol
    dom::O
    cod::O
end
```

可以读作：

> 定义一种名为 `Arrow` 的参数化数据结构。箭头名称使用 `Symbol` 表示，定义域和陪域使用同一种类型 `O` 的值表示。

其中：

$$
\begin{aligned}
O&=\text{对象标签所使用的 Julia 类型},\\
\texttt{dom},\texttt{cod}&=\text{该类型的具体值},\\
\texttt{name}&=\text{Symbol 类型的箭头名称}.
\end{aligned}
$$

在此基础上，下一步才是定义什么时候两条箭头可以复合：如果

$$
f:X\to Y,\qquad g:Y\to Z,
$$

即 `f.cod == g.dom`，那么可以构造复合箭头

$$
g\circ f:X\to Z.
$$
