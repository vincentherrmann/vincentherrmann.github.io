---
title: Wavelets I - From Filter Banks to the Dilation Equation
header:
  teaser: FilterCascadeDB4Analysis.png

fig1:
  - image_path: FilterBankDB4.png

fig2:
  - image_path: FilterCascadeDB4Analysis.png

fig3:
  - image_path: FilterCascadeDB4Synthesis.png

fig4:
  - image_path: WaveletGraph1Int.png

fig5:
  - image_path: WaveletGraph1Float.png

fig6:
  - image_path: DB4XApproximation.png

fig7:
  - image_path: WaveletGraph2Float.png

fig8:
  - image_path: DB4SynthesisFractals.png
  - image_path: DB4SynthesisSum.png

---

The fast wavelet transform (FWT) is easily implemented as a cascaded filter bank. However, the exact mathematical derivation from wavelet theory is a bit unwieldy. In this blog post I will try to shed some light on this connection by starting with the simple implementation algorithm and developing the wavelet properties from there.

## Filter Banks

A finite impulse response (FIR) filter transforms a discrete signal $x(n)$ by convoluting it with a finite series of values $h(k)$:

$$
y(n) = (h \ast x)(n) = \sum\limits_k h(k) x(n-k) \tag{1}
$$

The basic building block of our filter bank is shown in this graphic:
<!-- ![image](/images/FilterBankDB4.png) -->
{% include gallery id="fig1" caption="Fig.1: A simple critically sampled filter bank with perfect reconstruction" %}

The input signal $x(n)$ is split and fed into two different analysis filters $h_0$ and $h_1$. These two signals are downsampled by a factor of two (i.e. all values with odd $n$ are deleted). Now we have an intermediate representation of the input signal, consisting of two different signals $r_0$ and $r_1$, each with half the sample count. But if we do it right, since the total amount of samples remains the same, there could still be all information left from the input. To reconstruct the signal, the representations are now upsampled by a factor if two (a zero is inserted after each sample) and fed into the reconstruction filters $f_0$ and $f_1$. Then the outputs of these filters are added together.

If possible, we want the output of this whole setup to be exactly the same as the input, except maybe a constant gain and delay, making it a perfect reconstruction (PR) filter bank. The simplest set of filters meeting this condition are the Haar filter: $h_0 = [1, 1]$, $h_1 = [-1, 1]$, $f_0 = [1, 1]$, $f_1 = [1, -1]$. You can check it yourself by feeding a single impulse signal ($x = [..., 0, 0, 1, 0, 0, ...]$) into the filter bank and seeing that the output is still an impulse. Because of the linearity of the system this means that signals, since they are just a linear combination of many impulses, will be perfectly reconstructed.

Of course there are not than just the Haar filters that yield a PR filter bank. Let's look at the Z-transform of Figure 1:

$$ \begin{array}{rcl}
Y(z) & = & \frac{1}{2} \Big( H_0(z)F_0(z) + H_1(z)F_1(z) \Big) \: X(z) \: + \\ & &\frac{1}{2}\Big( H_0(-z)F_0(z) + H_1(-z)F_1(z) \Big) \: X(-z)
\end{array} \tag{1.2}
$$

Our PR condition, with gain $g$ and a delay of $d$ samples, in terms of the Z-transform is

$$
Y(z) =  g \: z^{-d} X(z)
$$

As we see, there is no use for the second term in $(1.2)$, i.e. the alias term proportional to $X(-z)$. The easiest way to get rid of it is to set

$$
F_0(z) = -H_1(-z)
$$

which is equivalent to $f_0(n) = (-1)^n h_1(n)$, and

$$
F_1(z) = H_0(-z)
$$

which is equivalent to $f_1(n) = (-1)^n h_0(n)$.

To have everything nice and compact we set $h_1$ to be $f_1$ in reverse:

$$
H_1(z) = z^{-(L-1)} F_1(z^{-1}) = z^{-(L-1)} H_0(-z^{-1})
$$

where $L$ is the length of $h_0$, or $h_1(n) = (-1)^n h_0(L-1-n)$. Now $h_1$, $f_0$ and $f_1$ can be expressend in terms of $h_0$. Equation $(1.2)$  combined with the PR condition becomes:

$$
Y(Z) = \frac{1}{2} \Big( H_0(z)F_0(z) + H_1(z)F_1(z) \Big) \: X(z)
$$

$$
= \frac{1}{2} \Big( -H_0(z)z^{-(L-1)} H_0(z^{-1}) \; - \; z^{-(L-1)} H_0(-z^{-1})H_0(-z) \Big) \: X(z) = g \: z^{-d} X(z)
$$

If we set $d=L-1$ and $g=-1$, we can write

$$
H_0(z)H_0(z^{-1}) \; + \; H_0(-z^{-1})H_0(-z) = 2
$$

This constraint is not quite as straightforward to translate for $h_0$. Using the definition of the Z-transform we can write

$$
H_0(z)H_0(z^{-1}) \; + \; H_0(-z^{-1})H_0(-z)
$$

$$
= \left( \sum_{n} h_0(n) z^{-n} \right) \left( \sum_{n} h_0(n) z^{n} \right) + \left( \sum_{n}-  h_0(n) z^{-n} \right) \left( \sum_{n} - h_0(n) z^{n} \right)
$$

$$
= \sum_m \sum_n h_0(n)h_0(n+m) z^m + \sum_m \sum_n -h_0(n)h_0(n+m) z^m
$$

$$
= 2 \sum_{\mathrm{even} \:m} \sum_n h_0(n)h_0(n+m) z^m = 2
$$

For $m \neq 0$, because it can't depend on $z$, $\sum_n h_0(n)h_0(n+m)$ has to be zero. If we set $k := \frac{1}{2}m$, our perfect reconstruction constraint for $h_0$ is:

$$
\sum_n h_0(n)h_0(n + 2k) = \delta (k) = \begin{cases} 1, \; k = 0 \\ 0, \; k\neq 0 \end{cases}
$$

Which means $h_0$ has to be orthogonal to versions of itself shifted by an even number of samples.

The representations $r_0$ and $r_1$ are themselves signals that can be fed into a similar filter bank module. We can do this an arbitrary number of times, resulting in more and more representations of coarser and coarser resolution.
<!-- ![image](/images/FilterCascadeDB4Analysis.png) -->
{% include gallery id="fig2" caption="Fig.2: Cascading analysis filter bank" %}

Reconstruction works the same way. And if all filter bank modules reconstruct the signal perfectly, so does the whole cascade.
<!-- ![image](/images/FilterCascadeDB4Synthesis.png) -->
{% include gallery id="fig3" caption="Fig.3: Cascading reconstruction filter bank" %}

As you can see, I use specific filters in the graphics. These are the filter coefficients of the Daubechies 4 wavelet, each one in a different color.

<span style="color:#37abc8">$h_0(0) = 0.6830127$</span>   
<span style="color:#d45500">$h_0(1) = 1.1830127$</span>   
<span style="color:#5aa02c">$h_0(2) = 0.3169873$</span>   
<span style="color:#ab37c8">$h_0(3) = -0.1830127$</span>

I picked these because of the manageable filter length of four, and their characteristic shape. My aim is to anchor the abstractions with some concrete elements and thus making it easier and more intuitive to grasp.

## Multi Resolution Convolution
In this section we will concentrate on the $h_0$ filter. So let's look at the upper half of Figure 2 (shaded in yellow). What has to happen to compute one sample, say the one with index 0, of the representation signal $r_{000}$? We can draw a graph describing the operation as a computational graph:

<!-- ![image](/images/WaveletGraph1Int.png) -->
{% include gallery id="fig4" caption="Fig.4: Computational graph for calculating one ouput sample of the third filter bank stage" %}

The white squares illustrate the signal at different representation states, which I have slightly renamed for convenience: $s_0 = x, s_1 = r_0, s_2 = r_{00}$ and in general $s_i$ being the representation $r$ with $i$ subscript zeros, meaning the output of the $i$th analysis filter $h_0$. A colored line stands for a multiplication with the corresponding filter coefficient, following the specified convolution and downsampling rules.
$$
s_{n+1} = \sum\limits_k h_0(k) s_n(2j - k) \tag{3}
$$
It should be clear how the graph would look like if we added more representation levels and looked at the sample 0 of the innermost signal. The graph would grow upwards, getting denser and denser at the top, but the bottom part stayed the same, only the labels of the representations would change.

We can look the graph in a different way: All the operations for generating the bottom sample 0 from the input signal $x$ - since they are all linear - can be combined into a single long filter $c_n$, where $n$ is the number of considered representation stages. To get the coefficients of this combined filter, we look at all the paths connecting a square at the level $c_n$ to the bottom square. These paths all have $latex n$ colored segments. The coefficients corresponding to the color of the segments are multiplied and these products are added for each different path. Note that now the white squares don't depict the signal in its various representations anymore, but the coefficients of the combined filter $c_n$. For example, if we take $c_3[-10]$, there are four paths to $c_0[0]$:

<span style="font-family:Arial">
[-10]<span style="color: #37abc8;">——</span>[-5]<span style="color: #d45500;">——</span>[-2]<span style="color: #5aa02c;">——</span>[0] <br>
[-10]<span style="color: #37abc8;">——</span>[-5]<span style="color: #ab37c8;">——</span>[-1]<span style="color: #d45500;">——</span>[0] <br>
[-10]<span style="color: #5aa02c;">——</span>[-4]<span style="color: #37abc8;">——</span>[-2]<span style="color: #5aa02c;">——</span>[0] <br>
[-10]<span style="color: #5aa02c;">——</span>[-4]<span style="color: #5aa02c;">——</span>[-1]<span style="color: #d45500;">——</span>[0] <br>  
</span>

This results in a filter coefficient
$$c_3[-10] = h_0(0) h_0(1) h_0(2) + h_0(0) h_0(3) h_0(1) + h_0(2) h_0(0) h_0(2) + h_0(2) h_0(2) h_0(1)$$

The resulting factor is exactly how an input sample is scaled while traveling through the graph from top to bottom.

The efficient way to compute the coefficients for $c_n$ is working the way up the graph and using the following rule (all values of $c_n$ with non-integer indices are zero):
$$
 c_{n+1}(j) = \sum\limits_k h_0(k) c_n(\frac{j+k}{2}) \tag{4}
 $$

The length of the filter $c_n$ more than doubles for each subsequent level. But the wavelet scaling function, which by the way we are currently trying to derive, is a continuous function with compact support. To get a step closer in this direction, we have to change the way of indexing the filters. So we introduce new functions $x_n(t_n) = c_n(j)$, where $t_n = -2^{-n}j$, which also means $t_n = 2t_{n+1}$.

<!-- ![image](/images/WaveletGraph1Float.png) -->
{% include gallery id="fig5" caption="Fig.5: The same graph as figure 4, with new indexing" %}

We have to adapt our construction progression for the filter functions $x_n$:

$$ \begin{array}{rcl}
c_{n+1}(j) & = & \sum\limits_k h_0(k) c_n(\frac{j+k}{2}) \\
x_{n+1}(t_{n+1}) & = & \sum\limits_k h_0(k) c_n(\frac{j+k}{2}) \\
& = & \sum\limits_k h_0(k) x_n(-2^{-n} \frac{j+k}{2}) \\
& = & \sum\limits_k h_0(k) x_n(\frac{-2^{-n}j}{2} + \frac{-2^{-n}k}{2}) \\
& = & \sum\limits_k h_0(k) x_n(\frac{t_n}{2} + \frac{-2^{-n}k}{2}) \\
& = & \sum\limits_k h_0(k) x_n(t_{n+1} + \frac{-2^{-n}k}{2}) \\
\end{array} $$

Or when we set $t := t_{n+1}$
$$
x_{n+1}(t) = \sum\limits_k h_0(k) x_n(t - 2^{-n-1}k) \tag{5}
$$
We have to give this sequence a starting value, we use $x_0(0) = 1$. Then $x_1$ has just the $h_0$ filter coefficients as values. The next graphic shows the first several levels of $x$ and the converged progression:

<!-- ![image](/images/DB4XApproximation.png) -->
{% include gallery id="fig6" caption="Fig.6: Several approximation levels of $x$, from the filter coefficients to the scaling function" %}



## The Dilation Identity

This first step, calculating $x_1$ from $x_0$, could also be achieved by $x_1(t) = \sum_k h_0(k) x_0(2t - k)$, as we can easily see. This currently seems somewhat arbitrary, but let's generalize this relation nevertheless to a construction progression of different function $\phi$:

$$
\phi_{n+1}(t) =   \sum\limits_k h_0(k) \phi_n(2t - k)
$$

Notice that it has the same form as the progression for $s_n$ further above. I think  this resemblance can be a bit misleading, as blurs the distinction between the filter bank implementation and the underlying mathematical framework of the multi resolution analysis (MRA). Looking at the corresponding graph shows that the link between $x_n$ and $\phi_n$ is less obvious at it may seem at the first superficial glance:

<!-- ![image](/images/WaveletGraph2Float.png) -->
{% include gallery id="fig7" caption="Fig.7: Computational graph based on filter dilation" %}

The connections are completely different from the previous graph, except for the first step. But the remarkable thing is, that the paths connecting value of $\phi_n$ to $\phi_0$ have exactly the same color combinations as the $latex x_n$ graph. See for yourself! We can look again $\phi_3(1.250)$, which is equivalent to our previous example $c_3(-10)$. The paths connecting this node to $\phi_0(0)$ are:

<span style="font-family:Arial">
[1.250]<span style="color: #d45500;">——</span>[1.50]<span style="color: #5aa02c;">——</span>[1.0]<span style="color: #5aa02c;">——</span>[0] <br>
[1.250]<span style="color: #d45500;">——</span>[1.50]<span style="color: #ab37c8;">——</span>[0.0]<span style="color: #37abc8;">——</span>[0] <br>
[1.250]<span style="color: #5aa02c;">——</span>[0.50]<span style="color: #37abc8;">——</span>[1.0]<span style="color: #5aa02c;">——</span>[0] <br>
[1.250]<span style="color: #5aa02c;">——</span>[0.50]<span style="color: #d45500;">——</span>[0.0]<span style="color: #37abc8;">——</span>[0] <br>
</span>

And with that we have

$$
\phi_3(-1.250) = h_0(1) h_0(2) h_0(2) + h_0(1) h_0(3) h_0(0) + h_0(2) h_0(0) h_0(2) + h_0(2) h_0(1) h_0(0)
$$
$$
= c_3(-10)
$$

The order of the paths is jumbled, as are the colors of the path segments (those are, in fact, exactly reversed). But in the end, they generate the same result. But while we can verify the identity $\phi_n(t) = x_n(t)$ for $n={1, 2, 3}$, this seems a bit magical and is nothing more than a nice observation. We need a proof, that the identity holds for all $n$. Luckily, that's not too difficult to accomplish via induction.

Let's start with our two progressions:

$$ \begin{array}{rcl}
x_{n+1}(t) & = & \sum\limits_k h_k x_n(t-2^{-n-1}k) \\
\phi_{n+1}(t) & = & \sum\limits_k h_k \phi_n(2t-k)
\end{array} $$

We assume that $x_n = \phi_n$. They are now interchangeable and we swap them.

$$ \begin{array}{rcl}
 x_{n+1}(t) & = & \sum\limits_k h_k \phi_n(t-2^{-n-1}k) \\
\phi_{n+1}(t) & = & \sum\limits_k h_k x_n(2t-k)
\end{array} $$

Then we go back one more level and plug in the recursive step that defines $\phi_n$ or $x_n$ in terms of $\phi_{n-1}$ or $x_{n-1}$.

$$ \begin{array}{rclcl}
 x_{n+1}(t) & = & \sum\limits_{k,l} h_k h_l \phi_{n-1}(2(t-2^{-n-1}k)-l) & = & \sum\limits_{k,l} h_k h_l \phi_{n-1}(2t-2^{-n}k-l) \\
\phi_{n+1}(t) & = & \sum\limits_{k,l} h_k h_l x_{n-1}((2t-l) - 2^{-(n-1)-1}k) & = & \sum\limits_{k,l} h_k h_l x_{n-1}(2t-2^{-n}k -l)
\end{array} $$

The arguments of $\phi_{n-1}$ and $x_{n-1}$ on the right are of course the same. This means, if we additionally assume $\phi_{n-1} = x_{n-1}$, then $\phi_{n+1} = x_{n+1}$. In short:

If $\phi_{n} = x_{n}$ and $\phi_{n-1} = x_{n-1}$, then $\phi_{n+1} = x_{n+1}$

We have already seen, that our assumptions hold for the first two levels, i.e. $\phi_0(t) = x_0(t)$ and $\phi_1(t) = x_1(t)$. With that, as we showed, we have $\phi_2(t) = x_2(t)$, and as a consequence of that $\phi_3(t) = x_3(t)$, and so on for all $n$. Therefore we have proved that indeed $\phi_n(t) = x_n(t); n \geqslant 0, t \in R$, if $\phi_0(0) = x_0(0) = 1$ and $\phi_0(t) = x_0(t) = 0;  \forall t \neq 0$.

## The Dilation and Wavelet Equation

For $n \to \infty$, $\phi_n$ converges to a continuous function with support $[0, K-1]$, where $K$ is the number of coefficients of $h_0$, and $x_n(0) = x_n(K-1) = 0$. Let's call this function simply $\phi$. This converged progression still has to hold the construction criterion:
$$
\phi(t) = \sum\limits_k h_k \phi(2t-k) \tag{6}
$$
This is the dilation equation, the workhorse in the theory of FWT and multi resolution analysis (MRA). And $\phi$ itself is the scaling function of the FWT, in our concrete examples the DB4 scaling function. We of course have a way to approximate it by iterating out progression.

While it is not possible to write the scaling function out explicitly, we can get can exact values by solving a system of linear equations derived from the dilation equation.

$$\begin{array}{rcl}
\phi(0) & = & h_0(0) \phi(0) \\
\phi(1) & = & h_0(2) \phi(0) + h_0(1) \phi(1) + h_0(0) \phi(2) \\
\phi(2) & = & h_0(3) \phi(1) + h_0(2) \phi(2) + h_0(1) \phi(3) \\
\phi(3) & = & h_0(3) \phi(3)
\end{array}$$

or

$$ \small \begin{array}{rcrcrcrr}
(h_0(0) - 1)*\phi(0) & + & 0*\phi(1) & + & 0*\phi(2) & + & 0*\phi(3) & = 0
\\ h_0(2)*\phi(0) & + &  (h_0(1) - 1)*\phi(1) & + & h_0(0)*\phi(2) & + & 0*\phi(3) & = 0
\\ 0*\phi(0) & + &  h_0(3)*\phi(1) & + & (h_0(2)-1)*\phi(2) & + & h_0(1)*\phi(3) & = 0
\\ 0*\phi(0) & + & 0*\phi(1) & + & 0*\phi(2) & + & (h_0(3)-1)*\phi(3) & = 0
\end{array}
$$

This system is homogeneous, meaning it has only zeros on the right side, and has no distinct solution. We have modify it slightly:

$$ \small \begin{array}{rcrcrcrr}
(h_0(0) - 1)*\phi(0) & + & 0*\phi(1) & + & 0*\phi(2) & + & (h_0(3)-1)*\phi(3) & = 0
\\ h_0(2)*\phi(0) & + &  (h_0(1) - 1)*\phi(1) & + & h_0(0)*\phi(2) & + & 0*\phi(3) & = 0
\\ 0*\phi(0) & + &  h_0(3)*\phi(1) & + & (h_0(2)-1)*\phi(2) & + & h_0(1)*\phi(3) & = 0
\\ 1*\phi(0) & + & 1*\phi(1) & + & 1*\phi(2) & + & 1*\phi(3) & = 1
\end{array} $$

I have added the first and last equation together and added an additional constraint, namely that the sum of the four variables should be 1. This system can be solved and gives us the values of $\phi$ at the four integer positions. We plug these values in the dilation equation to get the values that lie exactly halfway between them and repeat this procedure. This way we have very quickly a large amount of exact values of $\phi$.

The dilation equation says, that the scaling function has a fractal self-similarity: it can be constructed of versions of itself, shifted and compressed by a factor of two.

<!-- ![image](/images/DB4SynthesisFractals.png)
![image](/images/DB4SynthesisSum.png) -->
{% include gallery id="fig8" caption="Fig.8: Fractal construction of the DB4 scaling function from versions of a different scale, scaled by the $h_0$ coefficients" %}

The scaling function $\phi$ and the wavelet function $latex \psi$ are theoretical limits, that never actually occur in a practical filter bank implementation of the FWT, not even as a discretized or subsampled version. This is an important distinction from a discrete implementation of the continuous wavelet transform, where the scaled wavelets are explicitly used.

The fact, that the actually (implicitly) used filter $\phi_n$ with finite $n$ vary from $\phi$, can be seen as a discretization artifact. A signal with a higher sample rate uses a better approximation of $\phi$ at a certain scale, because it must have gone through more precedent filters to reach this level. If we could use the filter banks on a infinitesimally sampled signal, all filters would have had an infinite count of filters before them, making the effective filter be equal to $\phi$.
