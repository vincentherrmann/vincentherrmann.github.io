---
title: Wavelets II - Vanishing Moments and Spectral Factorization
header:
  teaser: db6SynthesisSum.png

fig1:
  - image_path: db6SynthesisFunctions.png

fig2:
  - image_path: db6SynthesisSum.png
---

In the previous blog post I described the workings of the Fast Wavelet Transform (FWT) and Multiresolution Analysis (MRA). We saw that the scaling function $\phi$ and the wavelet function $\psi$ are defined by the filter coefficients $h_0$ by the dilation/refinement equations:

$$
\phi(t) = \sum\limits_k h_0(k) \phi(2t-k)
$$

$$
\psi(t) = \sum\limits_k h_1(k) \phi(2t-k)
$$

## Vanishing Moments

The idea of vanishing moments is closely linked to the filter bank implementation. The signal is split in two parts, one part that was analyzed with $\psi$ and one that was analyzed with $\phi$. If $\psi$ is orthogonal to the signal $x(t)$, i.e. $\int x(t) \psi(-t) \mathrm{d}t = 0$, the whole signal is represented by the $\phi$ half and can nevertheless be perfectly reconstructed. This scenario is of course great for compression, and in general for data manipulation or analysis. So one measure of quality of the wavelet function $\psi$ is, to how many important functions it stands orthogonal to. In the case of so-called vanishing moments these important target function are polynoms.

The $n$th moment of a function $f$ is defined as:

$$
M_n(f) = \int t^n f(t) \mathrm{d}t
$$

If this moment vanishes, then $f(t)$ is orthogonal to $t^n$. If we say a function has $A$ vanishing moments, we usually mean it has vanishing moments $M_n = 0$ for $n=0, 1, ...,  A-1$. Because of the linearity of the integration operation, this means that the function is orthogonal to all polynoms up to degree $A$:

$$ \int \sum\limits_{n=0}^{A-1} c_n t^n f(t) \mathrm{d}t = \sum\limits_{n=0}^{A-1} c_n M_n(f)= 0$$

Polynoms of high degrees can approximate many different signals. This means, a wavelet function with many vanishing moments stands orthogonal or almost orthogonal to a wide range of different signals. The corresponding scaling function $\phi$ in turn has the expressive power to reconstruct all these signals. The downside is, as it turns out, that for more vanishing moments we need longer filters in the filter bank implementation.

The Daubechies 6 wavelets have three vanishing moments (we will se shortly how to construct them). This means, the Db6 scaling functions by them self can produce all polynoms with a degree up to two. In the next picture, I have analyzed some quadratic polynom with the Db6 scaling function and plotted some synthesis scaling functions shifted and scaled by the computed coefficients.

<!-- ![image](/images/db6SynthesisFunctions.png) -->
{% include gallery id="fig1" caption="Fig.1: A quadratic signal and DB6 synthesis scaling functions" %}

It seems a bit strange that these odd, spiky shapes sum up to a smooth parable. But if we add one at a time, we see that see fit like pieces of a puzzle to create a (shifted) section of the original function.

<!-- ![image](/images/db6SynthesisSum.png) -->
{% include gallery id="fig2" caption="Fig.2: The DB6 synthesis scaling function added together" %}


## Connection to Filter Coefficients

Now we have new criteria for our scaling- and wavelet-function. But in a FWT setting, our functions are defined through the filter coefficients $h_0$ and $h_1$, where $h_1(k) = (-1)^k h_0(k)$. For the next part, we will only use $h_1$, so let's call it only $h$ for now. So how do we translate the idea of vanishing moments into constraints for these coefficients? First we plug the wavelet equation into the definition of the vanishing moments:

$$
M_n(\psi) = \int t^n \sum\limits_k h(k) \phi(2t-k) \mathrm{d}t = 0
$$

We assume that $\phi$ has the necessary moments, but they are not zero. Now we create a new variable $s_k = 2t-k$:

$$
M_n(\psi) = \int (\frac{s_k + k}{2})^n \sum\limits_k h(k) \phi(s_k) \mathrm{d}s_k
$$

$$
= \sum\limits_k h(k) \int (\frac{s_k + k}{2})^n \phi(s_k) \mathrm{d}s_k = 0
$$

Let's look at the $0$th moment:

$$
M_0(\psi) = \sum\limits_k h(k) \int \phi(s_k) \mathrm{d}s_k = \sum\limits_k h(k) M_0(\phi(s_k)) = 0
$$

The integral  $\int \phi(s_k) \mathrm{d}s_k = \int \phi(2t-k) \mathrm {d}t$ is invariant to changes in $k$, so $M_n(\phi(s_k))$ is constant for all $k$. With that, the requirement for one vanishing moment is:

$$
\sum\limits_k h(k) = 0
$$

Now we can go on with vanishing moment $1$:

$$
M_1(\psi) = \sum\limits_k h(k) \int (\frac{1}{2} s_k \phi(s_k) +  \frac{1}{2} k \phi(s_k)) \mathrm{d}s_k
$$

$$
= \sum\limits_k h(k) (\frac{1}{2} k M_0(\phi(s_k)) + \frac{1}{2} M_1(\phi(s_k))) = 0
$$

The second term $\sum_k h(k) \frac{1}{2} M_1(\phi(s_k))$ is zero, we know that from the condition for the $0$th vanishing moment. From the second term $\sum_k h(k) \frac{1}{2} k M_0(\phi(s_k)) = 0$ follows the new condition for vanishing moment $1$:

$$
\sum\limits_k k h(k) = 0
$$

And vanishing Moment $2$:

$$
M_2(\psi) = \sum\limits_k h(k) \int \frac{1}{4} s_k^2 \phi(s_k) +  \frac{1}{2} k \phi(s_k) + \frac{1}{4} k^2 \phi(s_k)\mathrm{d}s_k
$$

$$
= \sum\limits_k h(k) (\frac{1}{4} k^2 M_0(\phi(s_k)) + \frac{1}{2} k M_1(\phi(s_k))  + \frac{1}{4} M_2(\phi(s_k))) = 0
$$

Now the second and third term are both zero, based on the previous conditions. And the new condition for vanishing moment $2$ is:

$$
\sum\limits_k k^2 h(k) = 0
$$

For every new vanishing moment $n$, there will be a term proportional to $\sum_k h(k) k^n M_n(\phi(s_k))$. All other terms will have a factor $k^m$ with $m<n$, those will automatically zero, based on the previous conditions. With that we have the condition for filter coefficients $h$ of a wavelet function $\psi$ with $A$ vanishing moments:

$$
\sum\limits_k k^n h(k) = 0; \: \: n = 0, 1, ..., A-1
$$

## Construction in the Fourier Domain

Now we have all the conditions to construct useful wavelets. Unfortunately, this construction is probably the fiddliest part.
