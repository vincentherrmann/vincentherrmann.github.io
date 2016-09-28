---
title: Wavelets II - Vanishing Moments and Spectral Factorization
header:
  teaser: db6SynthesisSum.png

fig1:
  - image_path: db6SynthesisFunctions.png

fig2:
  - image_path: db6SynthesisSum.png
---

**This post is not yet finished - stay tuned!**

In the previous blog post I described the workings of the Fast Wavelet Transform (FWT) and Multiresolution Analysis (MRA). We saw that the scaling function $\phi$ and the wavelet function $\psi$ are defined by the filter coefficients $h_0$ by the dilation/refinement equations:

$$
\phi(t) = \sum\limits_k h_0(k) \phi(2t-k) \tag{2.1}
$$

$$
\psi(t) = \sum\limits_k h_1(k) \phi(2t-k) \tag{2.2}
$$

## Vanishing Moments

The idea of vanishing moments is closely linked to the filter bank implementation. The signal is split in two parts, one part that was analyzed with $\psi$ and one that was analyzed with $\phi$. If $\psi$ is orthogonal to the signal $x(t)$, i.e. $\int x(t) \psi(t) \mathrm{d}t = 0$, the whole signal is represented by the $\phi$ half and can nevertheless be perfectly reconstructed. This scenario is of course great for compression, and in general for data manipulation or analysis. So one measure of quality of the wavelet function $\psi$ is, to how many important functions it stands orthogonal to. In the case of so-called vanishing moments these important target function are polynomials.

The $n$th moment of a function $f$ is defined as:

$$
M_n(f) = \int t^n f(t) \mathrm{d}t
$$

If this moment vanishes, then $f(t)$ is orthogonal to $t^n$. If we say a function has $A$ vanishing moments, we usually mean it has vanishing moments $M_n = 0$ for $n=0, 1, ...,  A-1$. Because of the linearity of the integration operation, this means that the function is orthogonal to all polynomials up to degree $A$:

$$ \int \sum\limits_{n=0}^{A-1} c_n t^n f(t) \mathrm{d}t = \sum\limits_{n=0}^{A-1} c_n M_n(f)= 0$$

polynomials of high degrees can approximate many different signals. This means, a wavelet function with many vanishing moments stands orthogonal or almost orthogonal to a wide range of different signals. The corresponding scaling function $\phi$ in turn has the expressive power to reconstruct all these signals. The downside is, as it turns out, that for more vanishing moments we need longer filters in the filter bank implementation.

The Daubechies 6 wavelets have three vanishing moments (we will se shortly how to construct them). This means, the Db6 scaling functions by them self can produce all polynomials with a degree up to two. In the next picture, I have analyzed some quadratic polynomial with the Db6 scaling function and plotted some synthesis scaling functions shifted and scaled by the computed coefficients.

<!-- ![image](/images/db6SynthesisFunctions.png) -->
{% include gallery id="fig1" caption="Fig.1: A quadratic signal and DB6 synthesis scaling functions" %}

It seems a bit strange that these odd, spiky shapes sum up to a smooth parable. But if we add one at a time, we see that see fit like pieces of a puzzle to create a (shifted) section of the original function.

<!-- ![image](/images/db6SynthesisSum.png) -->
{% include gallery id="fig2" caption="Fig.2: The DB6 synthesis scaling function added together" %}


## Connection to Filter Coefficients

Now we have new criteria for our scaling- and wavelet-function. But in a FWT setting, our functions are defined through the filter coefficients $h_0$ and $h_1$. So how do we translate the idea of vanishing moments into constraints for these coefficients? First we plug the wavelet equation $(2.2)$ into the definition of the vanishing moments:

$$
M_n(\psi) = \int t^n \sum\limits_k h_1(k) \phi(2t-k) \mathrm{d}t = 0
$$

We assume that $\phi$ has the necessary moments, but they are not zero. Now we create a new variable $s_k = 2t-k$:

$$
M_n(\psi) = \int \left( \frac{s_k + k}{2} \right)^n \sum\limits_k h_1(k) \phi(s_k) \mathrm{d}s_k
$$

$$
= \sum\limits_k h_1(k) \int \left( \frac{s_k + k}{2} \right)^n \phi(s_k) \mathrm{d}s_k = 0
$$

Let's look at the $0$th moment:

$$
M_0(\psi) = \sum\limits_k h_1(k) \int \phi(s_k) \mathrm{d}s_k = \sum\limits_k h_1(k) M_0(\phi(s_k)) = 0
$$

The integral  $\int \phi(s_k) \mathrm{d}s_k = \int \phi(2t-k) \mathrm {d}t$ is invariant to changes in $k$, so $M_n(\phi(s_k))$ is constant for all $k$. With that, the requirement for one vanishing moment is:

$$
\sum\limits_k h_1(k) = 0
$$

Now we can go on with vanishing moment $1$:

$$
M_1(\psi) = \sum\limits_k h_1(k) \int \left( \frac{1}{2} s_k \phi(s_k) +  \frac{1}{2} k \phi(s_k) \right) \mathrm{d}s_k
$$

$$
= \sum\limits_k h_1(k) \left( \frac{1}{2} k M_0(\phi(s_k)) + \frac{1}{2} M_1(\phi(s_k)) \right) = 0
$$

The second term $\sum_k h_1(k) \frac{1}{2} M_1(\phi(s_k))$ is zero, we know that from the condition for the $0$th vanishing moment. From the second term $\sum_k h_1(k) \frac{1}{2} k M_0(\phi(s_k)) = 0$ follows the new condition for vanishing moment $1$:

$$
\sum\limits_k k h_1(k) = 0
$$

And vanishing Moment $2$:

$$
M_2(\psi) = \sum\limits_k h_1(k) \int \left( \frac{1}{4} s_k^2 \phi(s_k) +  \frac{1}{2} k \phi(s_k) + \frac{1}{4} k^2 \phi(s_k) \right) \mathrm{d}s_k
$$

$$
= \sum\limits_k h_1(k) \left( \frac{1}{4} k^2 M_0(\phi(s_k)) + \frac{1}{2} k M_1(\phi(s_k))  + \frac{1}{4} M_2(\phi(s_k)) \right) = 0
$$

Now the second and third term are both zero, based on the previous conditions. And the new condition for vanishing moment $2$ is:

$$
\sum\limits_k k^2 h_1(k) = 0
$$

For every new vanishing moment $n$, there will be a term proportional to $\sum_k h_1(k) k^n M_n(\phi(s_k))$. All other terms will have a factor $k^m$ with $m<n$, those will automatically zero, based on the previous conditions. With that we have the condition for filter coefficients $h$ of a wavelet function $\psi$ with $A$ vanishing moments:

$$
\sum\limits_k k^n h_1(k) = 0; \: \: n = 0, 1, ..., A-1 \tag{2.3}
$$

Or, because $h_1 = -(-1)^k h_0(L-1-k)$, see [$(1.6)$](/wavelets-i#eq-6):

$$
\sum\limits_k k^n (-1)^k h_0(k) = 0; \: \: n = 0, 1, ..., A-1 \tag{2.4}
$$

## Construction in the Fourier Domain

Now we have all the conditions to construct useful wavelets. Unfortunately, this construction is probably the fiddliest part.

By definition, the fourier-transform of $h_0$ is

$$
H_0(\omega) = \sum_k h_0(k) e^{-i k \omega} \tag{2.5}
$$

and the $n$th derivative of $H_0$:

$$
(D^n H_0)(\omega) = \sum_k h_0(k) (-i k)^n  e^{-i k \omega} = (-i)^n \sum_k k^n e^{-i k \omega} h_0(k)
$$

If we set $\omega = \pi$, we get $(D^n H_0)(\pi) = (-i)^n \sum_k k^n (-1)^k h_0(k)$.
This means

$$
(D^n H_0)(\pi) = 0; \: \: n = 0, 1, ..., A-1 \tag{2.6}
$$

is equivalent to $(2.4)$ and $(2.3)$. The easiest way to achieve this would be setting $H_0 (\omega) = (1 + e^{-i \omega})^A$.   This unfortunately interferes with the shift orthogonality condition [$(1.7)$](/wavelets-i#eq-7) which we discovered in the last post. Converting between the Z- and fourier-transform is done using $z = e^{i \omega}$ and therefore $-z= \overline{e^{i(\omega+\pi)}}$ as well as $z^{-1}=e^{i \omega}$. Because $h_0(k)$ are real values, we can also write $H_0(-z) = \overline{H_0(\omega + \pi)}$ and   $H_0(z^{-1}) = \overline{H_0(\omega)}$. Now we can write $(1.7)$ as

$$
H_0(\omega) \overline{H_0(\omega)} \; + \; H_0(\omega + \pi) \overline{H_0(\omega + \pi)} =
$$

$$
\left| H_0(\omega) \right| ^2 + \left| H_0(\omega + \pi) \right| ^2 = 2 \tag{2.7}
$$

If we multiply some $H_0(\omega)$ for which $(2.6)$ is true with an arbitrary function $L(\omega)$, then $(2.6)$ still holds because of the product rule. So we set

$$
H_0(\omega) = \bigg( \frac{1+e^{-i\omega}}{2} \bigg)^A L(\omega) \tag{2.8}
$$

and try to find $L$ such that condition $(2.7)$ is met. To get real coefficients $h_0$, we have to be able to write $(2.8)$ as

$$
H_0(\omega) = \left( \sum_k {A  k} \frac{1}{2^A} e^{-i k \omega} \right)  \left( \sum_j l(j) e^{-i j \omega} \right) \tag{2.9}
$$

which means $L(\omega)$ has to be a polynomial in $e^{-i \omega}$, also with real coefficients $l(j)$. The identity

$$
\left|  \frac{1+e^{-i\omega}}{2} \right|^2 = \frac{1 + \cos(\omega)}{2} = \cos^2 \left( \frac{\omega}{2} \right)
$$

gives us in combination with $(2.8)$:

$$
\left| H_0(\omega) \right| ^2 = \cos^{2A} \left( \frac{\omega}{2} \right) \left| L(\omega) \right| ^2
$$

Because $H_0(-\omega) = \overline{H_0(\omega)}$, which can see from directly from $(2.5)$, $\left| H_0(\omega) \right| ^2$ is an even function, meaning it is symmetric with respect to $\omega = 0$ and can be expressed in terms of only cosine-functions. The same has then to be true for $\left| L(\omega) \right| ^2$. With $\cos(\omega) = 1 - \sin^2(\frac{\omega}{2})$ and $P$ being a polynomial we can write:

$$
\left| L(\omega) \right| ^2 = P \left( \sin^2 \Big( \frac{\omega}{2}\Big) \right) \tag{2.10}
$$

Now we can write the shift orthogonality condition $(2.7)$ as

$$
\left| H_0(\omega) \right| ^2 + \left| H_0(\omega + \pi) \right| ^2 =
$$

$$
\cos^{2A} \left( \frac{\omega}{2} \right) P \left( \sin^2 \Big( \frac{\omega}{2}\Big) \right) + \sin^{2A} \left( \frac{\omega}{2} \right) P \left( \cos^2 \Big( \frac{\omega}{2}\Big) \right) = 2 \tag{2.11}
$$

If we set $y = \sin^2(\frac{\omega}{2})$, which also means $1-y = \cos^2(\frac{\omega}{2})$, we can write $(2.11)$ as

$$
(1-y)^A P(y) + y^A P(1-y) = 2 \tag{2.12}
$$

## Bezout's Identity
We are now probably at the most abstract point of the wavelet construction. Why all this effort to get a equation in the form of $(2.12)$? The reason is number theoretical result called [Bézout's identity](https://en.wikipedia.org/wiki/Bézout%27s_identity). You can read about it further elsewhere, but in our case it says that there exists a polynomial $P(y)$ of degree $A-1$ so that $(2.12)$ is true. How exactly it looks like, however, we have to find out ourselves. First we solve for $P(y)$:

$$ \begin{array}{rcl}
P(y) & = & (1-y)^{-A} \left(2 - y^A P(1-y) \right) \\
& = & 2 (1-y)^{-A} \: - \: y^AP(1-y)(1-y)^{-A}
\tag{2.13}
\end{array}$$

The second term has a factor $y^A$, so there is no way we can model it with a polynomial of degree $A-1$. The best we can do is create a Taylor expansion at $y=0$ of the first term $2(1-y)^{-A}$. For a function $f(y)$, a Taylor approximation at $y=0$ means

$$
f(y) \approx f(0) + \frac{f'(0)}{1!} y + \frac{f''(0)}{2!} y^2 + \frac{f'''(0)}{3!} y^3 + \: ...
$$

Our $f(y)$ is $2(1-y)^{-A}$ as we said. We can write out its $n$th derivative:

$$
D^n(2(1-y)^{-A}) = 2 \: (A)(A+1)\:...(A+n-1)  \left( (1-y)^{-A-n} \right)
$$

This means the coefficient of $y^n$ in our Taylor series is

$$
2 \frac{(A)(A+1)\:...(A+n-1)}{n!} = 2 \frac{(A+n-1)!}{n! \; (A-1)!} = 2 {A+n-1 \choose n}
$$

Now we can write out our solution for $P$:

$$
P(y) = 2 \sum_{n=0}^{A-1} {A + n - 1 \choose \:n} \: y^n \tag{2.14}
$$

We can verify, that this is a solution. We define the left side of $(2.12)$ as $S_{A-1}$

$$ \begin{array}{rcccl}
S_{A-1}(y) & = & \sum_{n=0}^{A-1} & {A-1+n \choose n} & \left( (1-y)^A y^n + y^A(1-y)^n \right) \\
& = & &{A-1 \choose 0} & \left( (1-y)^A + y^A \right) ((1-y) + y) \\
& & + &{A \choose 1} & \left( (1-y)^A y + y^A (1-y) \right) ((1-y) + y) \\
& & + &...\\
& & + &{2A-2 \choose A-1} & \left( (1-y)^A y^{A-1} + y^A (1-y)^{A-1} \right) ((1-y) + y)
\end{array}$$

Here we have multiplied every term with $((1-y)+y) = 1$, which of course is a legitimate thing to do. If we expand these products, we can write

$$ \begin{array}{rcccl}
S_{A-1}(y) & = & & {A-1 \choose 0} & \left( (1-y)^{A+1} + y^{A+1} \right) \\
& & + & \bigg( {A-1 \choose 0} + {A \choose 1}\bigg) & \left( (1-y)^{A+1} y + y^{A+1} (1-y) \right)  \\
& & + & ... \\
& & + & \bigg( \sum_{k=0}^{A-1} {A-1+k \choose k} \bigg) & \left( (1-y)^{A+1} y^{A-1} + y^{A+1} (1-y)^{A-1} \right)  \\
& & + & \bigg( \sum_{k=0}^{A-1} {A-1+k \choose k} \bigg) & \left( (1-y)^A y^A + y^A (1-y)^A \right) \\
& = & & \sum_{n=0}^{A-1} \bigg( \sum_{k=0}^{n} {A-1+k \choose k} \bigg) & \left( (1-y)^{A+1} y^n + y^{A+1} (1-y)^n \right) \\
& & + & \bigg( \sum_{k=0}^{A-1} {A-1+k \choose k} \bigg) & \left( (1-y)^A y^A + y^A (1-y)^A \right) \\
\end{array}$$

Let's just look at $\sum_{k=0}^{n} {A-1+k \choose k}$. We have

$$
\sum_{k=0}^{n+1} {A+k \choose k} = \frac{(A+n+1)!}{(n+1)! \: A!} + \sum_{k=0}^{n} \frac{(A+k-1)!}{k! \: A!}(A+k)
$$

$$
= {A+n+1 \choose n+1} + \sum_{k=0}^{n} \frac{(A+k-1)!} {k! \: (A-1)!} + \sum_{k=1}^{n} \frac{(A+k-1)!}{(k-1)! \: A!}
$$

...

<!-- ## Construction in the Z Domain
By definition, the Z-transform of $h_0$ is

$$
H_0(z) = \sum_k h_0(k) z^{-k} \tag{2.5}
$$

and its $n$th derivative $(D^n H_0)(z) = \sum_k h_0(k) (-k)^n  z^{-k}$. If we set $z=-1$ we get:

$$
(D^n H_0)(1) = \sum_k h_0(k) (-k)^n  (-1)^{-k} = (-1)^n \sum_k k^n (-1)^k h_0(k)
$$

This means

$$
(D^n H_0)(-1) = 0; \: \: n = 0, 1, ..., A-1 \tag{2.6}
$$

is equivalent to $(2.4)$ and $(2.3)$. The simplest function that achieves this $A$-fold zero at $z=-1$ is of course $(z+1)^A$. This unfortunately does not meet the the shift orthogonality condition [$(1.7)$](/wavelets-i#eq-7). But if we multiply $(z+1)^A$ with an arbitrary function $L(z)$, $(2.6)$ still holds because of the product rule. This means we set

$$
H_0(z) = 2^{1-A}(z+1)^A L(z) \tag{2.7}
$$

(where we added a factor $2^{1-A}$, this will help us soon) and look for $L(z)$ such that

$$
H_0(z)H_0(z^{-1}) \; + \; H_0(-z^{-1})H_0(-z) = 2 \tag{2.8}
$$

We can plug $(2.7)$ into $(2.8)$ and get

$$
2^{1-A}(z+1)^A L(z) \; 2^{1-A} (z^{-1}+1)^A L(z^{-1}) \; + \; 2^{1-A} (-z^{-1}+1)^A L(-z^{-1}) \; 2^{1-A} (-z+1)^A L(-z) = 2
$$

$$
4^{1-A}(2+z+z^{-1})^A L(z) L(z^{-1}) \; + \; 4^{1-A} (2-z-z^{-1})^A L(-z) L(-z^{-1})= 2
$$

$$
(1-U(z))^A P_1(z) + U(z)^A P_2(z) = 2  \tag{2.9}
$$

with $U(z) = \frac{1}{4}(2 - z - z^{-1})$, $P_1(z) = L(z)L(z^{-1})$ and $P_2(z) = P_1(-z)$. Solving $(2.9)$ for $P(z)$ gives us

$$
P(z) = (1-U(z))^{-A} \left( 2-U(z)^AP_2(z) \right)
$$

There exists a number theoretical result, called [Bézout's identity](https://en.wikipedia.org/wiki/Bézout%27s_identity), which we can tweak for polynomials. It then says that there exists a solution for $P()$ -->
