---
title: "Counting Theorem 的直觉证明"
date: 2026-09-16
category: math
subcategory: algebra
series: algebra-ch0
seriesOrder: 3
tags:
  - algebra
  - group-action
  - counting-theorem
  - burnside-lemma
lang: zh
description: "从重复计数的修正出发，解释为什么 Counting Theorem 等于群作用下不动对象数的平均值。"
draft: false
---

Counting Theorem 要解决的问题是：

> 已经知道全部对象组成的集合 \(X\)，也知道允许哪些变换。把能够互相变换的对象视为同一种，究竟还剩多少种？

它给出的答案是：**每个变换所固定的对象数，取平均，恰好等于真正不同的种类数。**

这个“平均”确实不容易凭空想到。我们从更自然的问题出发：**同一种对象被重复记录了多次，怎样调整计数，让每一种最终只算一次？**

先看一个很小的例子。

两个固定位置，每个位置放一颗红珠或蓝珠。全部配置是

\[
X=\{RR,RB,BR,BB\}.
\]

允许两个操作：

\[
G=\{e,s\},
\]

其中 \(e\) 表示不动，\(s\) 表示交换左右两个位置。

允许交换后，\(RB\) 和 \(BR\) 属于同一种，因此有三个轨道：

\[
\{RR\},\qquad \{RB,BR\},\qquad \{BB\}.
\]

这里一个“对象”是一整幅配置，例如 \(RB\)；不是其中的一颗珠子。

现在先不用任何定理。我们想给每幅配置一个计数权重，使每个轨道加起来恰好等于 \(1\)。

那么自然应该这样分配：

\[
\begin{array}{c|cccc}
\text{对象}&RR&RB&BR&BB\\ \hline
\text{权重}&1&\frac12&\frac12&1
\end{array}
\]

因为：

\[
\{RR\}\text{ 贡献 }1,
\]

\[
\{RB,BR\}\text{ 贡献 }\frac12+\frac12=1,
\]

\[
\{BB\}\text{ 贡献 }1.
\]

把权重加起来：

\[
1+\frac12+\frac12+1=3,
\]

正好得到轨道数。

**这就是整个证明的起点：一个轨道若有 \(k\) 个对象，就让每个对象贡献 \(1/k\)。**

---

现在推广。设有限群 \(G\) 作用在有限集合 \(X\) 上。

对于对象 \(x\)，它的轨道是

\[
\operatorname{orb}(x)=\{g(x):g\in G\}.
\]

轨道就是“与 \(x\) 属于同一种”的全部对象。

如果它所在的轨道有 \(k\) 个对象，那么每个对象应该贡献 \(1/k\)。因此，若轨道数为 \(t\)，我们已经得到：

\[
\boxed{
t=\sum_{x\in X}\frac1{|\operatorname{orb}(x)|}.
}
\tag{1}
\]

为什么这个式子成立？因为按轨道分组以后，每一组都是

\[
\underbrace{\frac1k+\cdots+\frac1k}_{k\text{ 项}}=1.
\]

有 \(t\) 组，加起来就是 \(t\)。

不过，式子 (1) 还没有提供方便的计算办法，因为我们可能不知道各个轨道有多大。接下来的任务是：

> 能否用群操作的信息，算出这个权重 \(1/|\operatorname{orb}(x)|\)？

为此，定义稳定子：

\[
\operatorname{Stab}(x)=\{g\in G:g(x)=x\}.
\]

它收集的是保持配置 \(x\) 不变的操作。

在刚才的例子中：

- \(RR\) 被 \(e,s\) 都保持不变，因此稳定子大小是 \(2\)；
- \(RB\) 只有 \(e\) 保持不变，因此稳定子大小是 \(1\)。

注意到：

\[
\frac{|\operatorname{Stab}(RR)|}{|G|}
=\frac22=1,
\]

\[
\frac{|\operatorname{Stab}(RB)|}{|G|}
=\frac12.
\]

这正好就是我们需要的权重。一般情况下也成立：

\[
\boxed{
\frac1{|\operatorname{orb}(x)|}
=
\frac{|\operatorname{Stab}(x)|}{|G|}.
}
\tag{2}
\]

式子 (2) 就是轨道-稳定子定理的另一种写法。下面把它证明清楚。

固定一个对象 \(x\)，让每个 \(g\in G\) 都作用在 \(x\) 上。按照“最后得到哪个对象”，把群操作分组。

对每个 \(y\in\operatorname{orb}(x)\)，定义

\[
T_y=\{g\in G:g(x)=y\}.
\]

例如，\(T_x\) 就是所有把 \(x\) 留在原状态的操作，所以

\[
T_x=\operatorname{Stab}(x).
\]

这些 \(T_y\) 将整个 \(G\) 划分成若干组：每个操作有唯一结果，所以不会遗漏，也不会分到两组。

关键是证明：**每一组 \(T_y\) 都和 \(T_x\) 一样大。**

选定一个把 \(x\) 送到 \(y\) 的操作 \(h\)，即

\[
h(x)=y.
\]

给定任何 \(s\in\operatorname{Stab}(x)\)，先做 \(s\)，再做 \(h\)，就有

\[
(hs)(x)=h(s(x))=h(x)=y.
\]

所以 \(hs\in T_y\)。

这给出一个对应：

\[
\operatorname{Stab}(x)\longrightarrow T_y,
\qquad s\longmapsto hs.
\]

这个对应可逆。若 \(g\in T_y\)，那么

\[
(h^{-1}g)(x)=h^{-1}(y)=x,
\]

所以 \(h^{-1}g\in\operatorname{Stab}(x)\)。它就是恢复原来 \(s\) 的方法。

因此

\[
|T_y|=|\operatorname{Stab}(x)|.
\]

于是，整个 \(G\) 被分成了：

\[
\underbrace{|\operatorname{orb}(x)|}_{\text{不同结果的数量}}
\]

组，每一组都有

\[
\underbrace{|\operatorname{Stab}(x)|}_{\text{产生同一个结果的操作数}}
\]

个操作。所以

\[
|G|
=
|\operatorname{orb}(x)|\,|\operatorname{Stab}(x)|,
\]

进而得到式子 (2)。

这说明：**一个对象在全部群操作中“保持不变的比例”，恰好是它所在轨道大小的倒数。**

这个比例正好可以用来修正重复计数。

---

把式子 (2) 代入式子 (1)，得到

\[
\begin{aligned}
t
&=\sum_{x\in X}\frac1{|\operatorname{orb}(x)|}\\[2mm]
&=\sum_{x\in X}\frac{|\operatorname{Stab}(x)|}{|G|}\\[2mm]
&=\frac1{|G|}\sum_{x\in X}|\operatorname{Stab}(x)|.
\end{aligned}
\tag{3}
\]

此时已经知道：把每个对象的稳定子大小加起来，除以群大小，就能得到轨道数。

但逐个检查对象可能仍然很多。我们希望改成逐个检查操作。

于是定义：

\[
\operatorname{fix}(g)=\{x\in X:g(x)=x\}.
\]

这里要仔细区别：

\[
\operatorname{Stab}(x)
\quad\text{固定对象 \(x\)，寻找哪些操作保持它不变；}
\]

\[
\operatorname{fix}(g)
\quad\text{固定操作 \(g\)，寻找哪些对象被它保持不变。}
\]

它们检查的是同一个条件：

\[
g(x)=x.
\]

用刚才的小例子，把所有检查结果填出来：

| 操作/对象 | \(RR\) | \(RB\) | \(BR\) | \(BB\) | 这一行的 ✓ 数 |
|---|---:|---:|---:|---:|---:|
| 不动 \(e\) | ✓ | ✓ | ✓ | ✓ | \(4\) |
| 交换 \(s\) | ✓ | - | - | ✓ | \(2\) |
| 这一列的 ✓ 数 | \(2\) | \(1\) | \(1\) | \(2\) | |

每列的 ✓ 数，就是那个对象的稳定子大小。例如 \(RB\) 这一列只有一个 ✓，所以

\[
|\operatorname{Stab}(RB)|=1.
\]

每行的 ✓ 数，就是那个操作的不动对象数。例如交换操作这一行有两个 ✓，所以

\[
|\operatorname{fix}(s)|=2.
\]

**按列加和与按行加和，数的是完全相同的六个 ✓：**

\[
\underbrace{2+1+1+2}_{\text{各对象的稳定子大小之和}}
=
\underbrace{4+2}_{\text{各操作的不动对象数之和}}.
\]

一般情况下，我们可以严格地定义这些 ✓ 组成的集合：

\[
M=\{(g,x)\in G\times X:g(x)=x\}.
\]

按对象 \(x\) 分组：

\[
|M|=\sum_{x\in X}|\operatorname{Stab}(x)|.
\]

按操作 \(g\) 分组：

\[
|M|=\sum_{g\in G}|\operatorname{fix}(g)|.
\]

因此

\[
\boxed{
\sum_{x\in X}|\operatorname{Stab}(x)|
=
\sum_{g\in G}|\operatorname{fix}(g)|.
}
\tag{4}
\]

将式子 (4) 代入式子 (3)，就得到 Counting Theorem：

\[
\boxed{
t=\frac1{|G|}\sum_{g\in G}|\operatorname{fix}(g)|.
}
\]

证明完成。

对于小例子，这就是

\[
t=\frac{4+2}{2}=3.
\]

---

现在回看你之前一直困惑的“每个轨道贡献 \(|G|\) 个不动事件”。

它其实是上述权重思路去掉分母后的说法。

一个轨道有 \(k\) 个对象。我们想让每个对象贡献 \(1/k\)，从而整个轨道贡献 \(1\)。轨道-稳定子定理告诉我们：

\[
\frac1k=\frac{|\operatorname{Stab}(x)|}{|G|}.
\]

所以也可以：

> 给每个对象记下它的不动操作数，再把整个轨道的总数除以 \(|G|\)，结果恰好为 \(1\)。

在表格中的中间轨道 \(\{RB,BR\}\)，两个对象各有一个 ✓：

\[
\frac{1+1}{2}=1.
\]

在轨道 \(\{RR\}\)，只有一个对象，但它有两个 ✓：

\[
\frac22=1.
\]

这就是它们虽然大小不同，却都被正确算成“一种”的原因。

**Counting Theorem 的数学直觉，是用对象自身的对称性，自动修正不同程度的重复计数。** 小轨道的对象重复记录较少，就需要较大的权重；大轨道的对象重复记录较多，就需要较小的权重。稳定子大小除以 \(|G|\)，恰好给出了这个权重。

最后把这些权重按操作重新加总，才出现了“平均不动对象数”这个看似意外的答案。
