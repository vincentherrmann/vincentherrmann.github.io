---
date: 2017-02-11
title: The Intuition Behind The Wasserstein Distance
---

The recent paper about Wasserstein-GANs sparked my interest in GANs

For the discriminator in a GAN, we need some way to measure the distance or divergence between the real and the fake data distribution. Usually, some kind of f-divergence or, most notably, the Jensen-Shannon divergence are used. They all have at the basis the quotient of the probability distributions. While they clearly do work, this fact is problematic for highly concentrated distributions (e.g. when the samples all lie on a low-dimensional submanifold). Then we are basically trying to divide by zero, and often get no useful gradient to train the generator, as is shown in the paper.

##Earth Mover's Distance

A more robust way to measure this distance is the Wasserstein-1 metric. First we will consider discrete distributions, in this case it is also descriptively called the Earth mover's distance (EMD). If we imagine the distributions as different heaps of the same amount of earth, then the EMD is the minimal total amount of work it takes to transform one heap into the other. Work is defined as the amount of earth in a chunk times the distance it was moved. Let's call our discrete distributions $P_r$ and $P_\theta$ and create a concrete example.

$P_r$
![p_r](/images/discrete_p_r.png)
$P_\theta$
![p_theta](/images/discrete_p_theta.png)

Calculating the EMD is in itself an optimization problem, because we need to find a transference plan $\gamma(x,y)$ that minimizes the work. $\gamma$ simply states how we distribute the amount of earth from $x$ over the domain of $y$, or vice versa. To be a valid transference plan, the constraints $\sum_x \gamma(x,y) = P_r(y)$ and $\sum_y \gamma(x,y) = P_\theta(x)$ must apply. Equivalently, we can call $\gamma$ a probability distribution and require that $\gamma \in \Pi(P_r, P_\theta)$, where $\Pi(P_r, P_\theta)$ is the set of all distributions whose marginals are $P_r$ resp. $P_\theta$. With that, the definition of the Earth mover's distance is:

$$
EMD(P_r, P_\theta) = \inf_{\gamma \in \Pi} \, \sum\limits_{x,y} \lVert x - y \lVert \gamma (x,y) = \inf_{\gamma \in \Pi} \ \mathbb{E}_{(x,y) \sim \gamma} \lVert x - y \lVert
$$

We can also de



##Linear Programming

To solve this problem, we can use the generic method of Linear Programming (LP). With LP, we search for a vector $\mathbf{x} \in \mathbb{R}^n$ that minimizes the cost $z = \mathbf{c}^T \mathbf{x}, \ \mathbf{c} \in \mathbb{R}^n$. Additionally, $\mathbf{x}$ is costrained by the equation $\mathbf{A} \mathbf{x} = \mathbf{b}, \ \mathbf{A} \in \mathbb{R}^{m \times n}, \mathbf{b} \in \mathbb{R}^n$ and $\mathbf{x} \geq \mathbf{0}$. The transference plan $\Gamma$, that we are looking for, has matrix form, but we can flatten it and define

$$
\mathbf{x} = \mathrm{vec}(\Gamma).
$$

Similarly, we define
$$
\mathbf{c} = \mathrm{vec}(\mathbf{D}).
$$

The target of out constraints are the $P_r$ and $P_\theta$. If we see them as vectors, we can set
$$
\mathbf{b} = \begin{bmatrix} P_r \\ P_\theta\end{bmatrix}.
$$

For $\mathbf{A}$, we have to construct a large sparse binary matrix that picks out the values from $\mathbf{x}$ and sums them to get $\mathbf{b}$. This schematic should make it clear:

$$
\newcommand\FixWidth[1]{ \hspace{1.9em} \llap{#1}}

\begin{array}{rc}

&  \left. \left[ \begin{array} {rrrr|rrrr}
\FixWidth{p_r(1)} & \FixWidth{p_r(2)} & \FixWidth{\dots} & \FixWidth{p_r(n)} & \FixWidth{p_g(1)} & \FixWidth{p_g(2)} & \FixWidth{\dots} & \FixWidth{p_g(n)}
\end{array} \right]  \, \right\} \; \mathbf{b} \\ \\

\mathbf{x} \left\{ \begin{bmatrix}
\gamma(1, 1) \\
\gamma(1, 2) \\
\vdots \\ \hline
\gamma(2, 1) \\
\gamma(2, 2) \\
\vdots \\ \hline
\vdots \\ \hline
\gamma(n, 1) \\
\gamma(n, 2) \\
\vdots \\
\end{bmatrix} \right.

& \left. \left[ \begin{array}{rrrr|rrrr}
1 & 0 & \dots & 0 & 1 & 0 & \dots & 0 \cr
1 & 0 & \dots & 0 & 0 & 1 & \dots & 0 \cr
\vdots & \vdots & \dots & \vdots & \vdots & \vdots & \ddots & \vdots \cr \hline
0 & 1 & \dots & 0 & 1 & 0 & \dots & 0 \cr
0 & 1 & \dots & 0 & 0 & 1 & \dots & 0 \cr
\vdots & \vdots & \dots & \vdots & \vdots & \vdots & \ddots & \vdots \cr \hline
\FixWidth{\vdots} & \FixWidth{\vdots} & \FixWidth{\vdots} & \FixWidth{\vdots} & \FixWidth{\vdots} &
\FixWidth{\vdots} & \FixWidth{\vdots} & \FixWidth{\vdots} \cr \hline
0 & 0 & \dots & 1 & 1 & 0 & \dots & 0 \cr
0 & 0 & \dots & 1 & 0 & 1 & \dots & 0 \cr
\vdots & \vdots & \dots & \vdots & \vdots & \vdots & \ddots & \vdots \cr
\end{array} \right] \right\} \mathbf{A}

\end{array}
$$

With that, we can call a standard LP routine, for example ```linprog()``` from scipy.

```python
import numpy as np
from scipy.optimize import linprog

# We construct our A matrix by creating two 3-way tensors,
# and then concatenating and reshaping them
A_r = np.zeros((l, l, l))
A_t = np.zeros((l, l, l))

for i in range(l):
	for j in range(l):
		A_r[i, j, i] = 1
		A_t[j, i, i] = 1

A = np.concatenate((A_r, A_t), axis=2).reshape((l**2, 2*l))
b = np.concatenate((P_r, P_t), axis=0)
c = D.reshape((l**2))

emd, x = linprog(c, A_eq=A.T, b_eq=b)
gamma = x.reshape((d, d))
```

Now we have our transference plan, as well as the EMD.

![p_r](/images/transfer_plan.png)

![p_r](/images/earth_move.png)

## Dual Form
This was the easy part. Unfortunately, this kind optimization is not practical in many cases, and certainly not in domains, where GANs are usually used. In our example, we use a one-dimensional random variable that can take ten states. The number of possible discrete states scales exponentially with respect of the number of dimensions of the input variable. Many applications have easily thousands of input dimensions. Even an approximation of $\gamma$ is virtually impossible.

But actually we don't care about $\gamma$. We only want a singe number, the EMD. And, as it turns out, there is another way of calculating it.

$$
\begin{array}{c|c}

\mathbf{primal \ form:} & \mathbf{dual \ form:}\\

\begin{array}{rrcl}
\mathrm{minimize} \ & z & = & \ \mathbf{c}^T \mathbf{x} \\
\mathrm{so \ that} \ & \mathbf{A} \mathbf{x} & = & \ \mathbf{b} \\
& \mathbf{x} & \geq &\ \mathbf{0}
\end{array} &

\begin{array}{rrcl}
\mathrm{maximize} \ & \tilde{z} & = & \ \mathbf{b}^T \mathbf{y} \\
\mathrm{so \ that} \ & \mathbf{A}^T \mathbf{y} & \leq & \ \mathbf{b} \\ \\
\end{array}

\end{array}
$$

We can see easily that $\tilde{z}$ is a lower bound for $z$:

$$
z = \mathbf{c}^T \mathbf{x} \geq \mathbf{y}^T \mathbf{A} \mathbf{x} = \mathbf{y}^T \mathbf{b} = \tilde{z}
$$

This is called *Weak Duality* theorem. As you might guess, there also exists the *Strong Duality* theorem, which states that, should we find an optimal solution for $\tilde{z}$, then $z=\tilde{z}$. I tried to find a short proof, and I will sketch it here. It still is a bit technical, and you can skip it, if you want.

---

---

$$
\mathbf{D} = d_{ij} = \lVert x_i - y_i \lVert \\
EM(p_r, p_g) = \inf_{\gamma} \, \langle D, \Gamma\rangle_\mathrm{F}
$$

Lagrangian:
$$
\min_x \max_\lambda L(x, \lambda) = c^T x + \lambda (Ax-b) \\
\min_y \max_{\alpha, \alpha \geq 0} L(x, \alpha) = -b^T y + \alpha(A^T y - c)
$$



$$
D_{ij} = \lVert x_i - y_i \lVert \\
EM(p_r, p_g) = \inf_{\gamma} \, \langle D, \Gamma\rangle_\mathrm{F}
$$

$$
c = \mathrm{vec}(D) \\
x = \mathrm{vec}(\Gamma)
$$

We can see calculating the EMD as a linear programming problem. We have to flatten our $\gamma$ matrix.

Linear programming is a generic problem of following form: Search for a vector $x$, so that the expression $c^T x$ minimizes.
Additionally there are constrains of the form $A x = b$.

$$
\begin{align}
z = & \ \mathbf{c}^T \mathbf{x} \\
\mathbf{A} \mathbf{x} = & \ \mathbf{b} \\
\mathbf{x} \geq & \ \mathbf{0}
\end{align}
$$




Dual Problem:
$$
\begin{align}
\tilde{z} = & \ \mathbf{b}^T \mathbf{y} \\
\mathbf{A}^T \mathbf{y} \leq & \ \mathbf{c} \\
\end{align}
$$

$$
\newcommand\FixWidth[1]{ \hspace{1.6em} \llap{#1}}

\begin{array}{rc}
&  \left. \left[ \begin{array} {rrr|rrr|r|rrr}
\FixWidth{D_{1,1}} & \FixWidth{D_{1,2}} & \FixWidth{\dots} & \FixWidth{D_{2,1}} & \FixWidth{D_{2,2}} & \FixWidth{\dots} & \FixWidth{\dots} & \FixWidth{D_{n,1}} & \FixWidth{D_{ n,2}} & \FixWidth{\dots}
\end{array} \right]  \, \right\} \; \mathbf{c} \\ \\

\mathbf{y} \left\{ \begin{bmatrix}
f(1) \\
f(2) \\
\vdots \\
f(n) \\ \hline
g(1) \\
g(2) \\
\vdots \\
g(n) \\
\end{bmatrix} \right.

& \left. \;\; \left[ \begin{array} {rrr|rrr|r|rrr}

1 & 1 & \dots & 0 & 0 & \dots & \dots & 0 & 0 & \dots \cr
0 & 0 & \dots & 1 & 1 & \dots & \dots & 0 & 0 & \dots \cr
\vdots & \vdots & \vdots & \vdots & \vdots & \vdots & \dots & \vdots & \vdots & \vdots  \cr
0 & 0 & \dots & 0 & 0 & \dots & \dots & 1 & 1 & \dots \cr \hline

1 & 0 & \dots & 1 & 0 & \dots & \dots & 1 & 0 & \dots \cr
0 & 1 & \dots & 0 & 1 & \dots & \dots & 0 & 1 & \dots \cr
\vdots & \vdots & \ddots & \vdots & \vdots & \ddots & \dots & \vdots & \vdots & \ddots  \cr
\FixWidth{0} & \FixWidth{0} & \FixWidth{\dots} & \FixWidth{0} & \FixWidth{0} & \FixWidth{\dots} & \FixWidth{\dots} & \FixWidth{0} & \FixWidth{0} & \FixWidth{\dots}
\end{array} \right] \right\} \mathbf{A}^T

\end{array}
$$

## Weak Duality

$$
\begin{align}
primal: &  &dual: \\
\max z = & \ \mathbf{c}^T \mathbf{x}        \hspace{3em} & \min \tilde{z} = & \ \mathbf{b}^T \mathbf{y} \\
\mathbf{A} \mathbf{x} \leq & \ \mathbf{b}  & \mathbf{A}^T \mathbf{y} \geq & \ \mathbf{c} \\
\mathbf{x} \geq & \ \mathbf{0}
\end{align}
$$

$$
z \leq \tilde{z} \\
z = \mathbf{c}^T \mathbf{x} \leq \mathbf{y}^T \mathbf{A} \mathbf{x} \leq \mathbf{b}^T \mathbf{y} = \tilde{z}
$$

## Strong Duality
optimal solution for primal program: $\mathbf{x}_0$
$$
\mathbf{V} = \mathbf{A}^{-1} \\
\mathbf{y} = \mathbf{c} \ \mathbf{V} \\
\mathbf{y} \ \mathbf{b} = \mathbf{c} \ \mathbf{V} \ \mathbf{b} = \mathbf{c} \ \mathbf{x}_0
$$
___
Only if strong duality holds, this is possible:
$$
\begin{align}
\mathbf{A} \mathbf{x} \leq & \ \mathbf{b} \\
\mathbf{c}^T \mathbf{x} \geq & \ \mathbf{b}^T \mathbf{y}\\
\mathbf{x} \geq & \ \mathbf{0}
\end{align}
$$

Or
$$
\begin{bmatrix} -\mathbf{A} \\ \mathbf{c}^T \end{bmatrix} \mathbf{x} \geq
\begin{bmatrix} -\mathbf{b} \\ \mathbf{b}^T \mathbf{y}\end{bmatrix}
$$

But let's assume, that's impossible, and the strong duality does not hold.

For $\epsilon > 0$, this has no solution:
$$
\begin{bmatrix} \mathbf{A} \\ -\mathbf{c}^T \end{bmatrix} \mathbf{x} \leq
\begin{bmatrix} \mathbf{b} \\ -z-\epsilon \end{bmatrix}
$$
So according to Farkas, there must be a solution to
$$

$$


##Wasserstein distance:

$$
W(p_r, p_g) = \inf_{\gamma \in \Pi} \mathbb{E} \left( \lVert x - y \lVert \right)
= \inf_{\gamma} \iint\limits_{x,y} \lVert x - y \lVert \gamma (x,y) \, \mathrm{d} x \, \mathrm{d} y
$$
