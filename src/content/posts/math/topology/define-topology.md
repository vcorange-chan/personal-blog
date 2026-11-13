---
title: "Defining Topology: Nearness Without Distance"
date: 2026-11-05
updatedDate: 2026-11-05
category: math
subcategory: topology
series: daily-understanding
tags: [topology, neighborhoods, daily-understanding]
lang: en
description: "From maps and neighborhoods to the axioms of a topology: local nearness without a prescribed metric."
draft: false
---

**One sentence:** 邻域不必先由距离产生；我们可以把局部邻近结构本身作为数学对象。

*Neighborhoods need not be defined through a distance; local nearness itself can be treated as a mathematical object.*

Recorded: 2026-11-05 06:30:17 AEST (UTC+10:00, Australia/Brisbane)

Updated: 2026-11-05 20:41:05 AEST (UTC+10:00, Australia/Brisbane)

Source: Clifford and GPT discussion; wording selected by Clifford.

**Opening example: maps.** Distances, angles, and areas provide numerical information, while connections and adjacency provide a different kind of information. These can be studied separately. A map may distort distances, areas, or angles while still showing which regions are connected or adjacent within the mapped area. Knowing certain neighborhood relations does not require knowing the distance between two locations.

For example, China shares a border with Laos, and Laos shares a border with Thailand. We can understand this chain of neighboring countries without knowing how far Beijing is from Bangkok. A map can therefore provide useful information about connections even when its numerical measurements differ from those on the Earth.

A flat map of the whole globe needs a cut or multiple charts, so adjacency across a cut must be recorded separately. A border-adjacency table is also only a coarse piece of information, rather than a complete neighborhood system. The example illustrates why nearness need not first be described by numerical distance: topology allows local nearness itself to be specified as structure.

**One basic motivation for the notion of a topology is to generalize the local notion of nearness from metric spaces to abstract sets without a prescribed metric, so that neighborhoods, convergence, and continuity can still be defined.**

Starting with a metric space, we first use the metric to define neighborhoods. A subset is open precisely when it is a neighborhood of each of its points. We then examine the family of all open subsets. The basic set operations considered here are unions, intersections, and complements. Setting aside the actual distance values and focusing on these operations, we observe that this family contains the empty set and the whole space, and is closed under arbitrary unions and finite intersections.

Abstracting these properties, we define a topology on an arbitrary set $X$ to be a family of subsets satisfying the same axioms. Its members are called the open sets of $X$ with respect to this topology. These open sets, in turn, determine the neighborhoods of each point.

Complementation is accounted for as well: the complement of an open set is called a closed set. The family of all closed sets contains the empty set and the whole space, and is closed under arbitrary intersections and finite unions. Thus, specifying all open sets and specifying all closed sets are two equivalent ways of describing the same topological structure.

**Definition (Topology).** Let $X$ be a set, and let $\mathcal P(X)$ denote its power set. A family $\tau\subseteq\mathcal P(X)$ is called a **topology on $X$** if it satisfies the following axioms:

(1) The empty set and the whole set belong to $\tau$:

$$
\varnothing\in\tau,\qquad X\in\tau.
$$

(2) The union of any family of members of $\tau$ belongs to $\tau$. For any index set $I$,

$$
U_i\in\tau\text{ for every }i\in I
\quad\Longrightarrow\quad
\bigcup_{i\in I}U_i\in\tau.
$$

(3) The intersection of any finite family of members of $\tau$ belongs to $\tau$. For every positive integer $n$,

$$
U_1,\ldots,U_n\in\tau
\quad\Longrightarrow\quad
\bigcap_{j=1}^{n}U_j\in\tau.
$$

The pair $(X,\tau)$ is called a **topological space**, and the members of $\tau$ are called its **open sets**.

**Logical order.**

**A metric gives neighborhoods → examine the set-operation laws of the family of all open sets → abstract these laws into the topology axioms → define neighborhoods on a set without a prescribed metric → study limits and continuity.**

> 度量给出邻域 → 考察全体开集的运算规律 → 抽象为拓扑公理 → 在未预设距离的集合上规定邻域 → 再研究极限与连续性。

In this route, **generalizing neighborhoods is the motivation; defining and studying continuity is the subsequent aim.**
