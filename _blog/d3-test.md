---
type: pages
layout: single
author_profile: false
header:
  teaser: wavelet-graph.jpg
date: 2017-04-17
title: Some Wavelet Visualizations
---

Recently I started to learn how to use [d3.js](https://d3js.org), a JavaScript library for interactive data-driven visualizations. As a first little project, I decided to make interactive and animated versions of graphics that I originally created for two articles on wavelets ([article 1](https://www.dsprelated.com/showarticle/1000.php), [article 2](https://www.dsprelated.com/showarticle/1006.php)). Besides being visually appealing, I hope that this shines a bit of light at some of the deep connections and fascinating properties of wavelets. Here I narrowed down the explanations to a bare minimum, but I linked the corresponding passages in my articles in case you want to dig a little deeper.

The code is maybe a bit messy, and some things were quite tricky to accomplish or do not yet work completely as I wanted. But in general, I am very pleased with d3, it's a really powerful and fun tool that produces beautiful results. Please let me know if you have any suggestions or questions!

## The Dilation and Wavelet Equation

In the Fast Wavelet Transform, the wavelets scaling function is defined by the dilation equation:

$$
\phi(t) = \sum\limits_k h_0(k) \phi(2t-k)
$$

This shows the fractal self-similarity of the scaling function: We can construct it from scaled and shifted versions of itself that are summed together. In a similar way, we can construct the wavelet function from the scaling function using the wavelet equation:

$$
\psi(t) = \sum\limits_k h_1(k) \phi(2t-k)
$$

[Read more...](https://www.dsprelated.com/showarticle/1000.php#eq-13)

Here you can see the construction of some famous scaling and wavelet functions:

<div id="wavelet_construction"></div>

[Code](https://github.com/vincentherrmann/vincentherrmann.github.io/blob/master/scripts/wavelet-construction.js)

## The Wavelet Dilation Graph

Here we try to show a certain equivalence of two graphs. The first one is derived directly from the filterbank implementation of the Fast Wavelet Transform, and has the following construction formula:

$$
x_{n+1}(t) = \sum\limits_k h_0(k) x_n(t - 2^{-n-1}k)
$$

The second graph shows several steps of the cascading algorithm, using the dilation equation:

$$
\phi_{n+1}(t) = \sum\limits_k h_0(k) \phi_n(2t - k)
$$

Each node depicts the value of $x_n(t)$ or $\phi_n(t)$ at certain $n$ and $t$. These values are obtained by following all possible paths from the specified node to the bottom: The colors of the edges stand for the different factors $h_0$, these factors of each path are multiplied, and the products arising from the paths are summed together. We see that the paths from both graphs have always exactly the same color combinations (although in a different order) and so they result in the same value. [Read more...](https://www.dsprelated.com/showarticle/1000.php#eq-11)

*The graphs get crowed pretty quickly if your choose long wavelets and many levels. Be careful, the number of paths increases exponentially!*

<div id="wavelet_graph"></div>

[Code](https://github.com/vincentherrmann/vincentherrmann.github.io/blob/master/scripts/wavelet-graph.js)

## Vanishing Moments

Some wavelet function have a property called vanishing moments. This means that they are orthogonal to polynomials up to a certain degree. The scaling function then has the expressive power to exactly reconstruct any segment of these polynomials perfectly, from few coefficients. Polynomials of higher degrees require longer wavelets. The Daubechies wavelets in particular are named on the number of vanishing moments they have. [Read more...](https://www.dsprelated.com/showarticle/1006.php#eq-1)

Here we show the perfect reconstruction from a finite number of scaled and shifted scaling functions. Every time you press **draw**, an appropriate polynomial is randomly generated and reconstructed.

<div id="vanishing_moments"></div>

[Code](https://github.com/vincentherrmann/vincentherrmann.github.io/blob/master/scripts/vanishing-moments.js)

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script src="{{site.basurl}}/scripts/wavelets.js"></script>
<script src="{{site.basurl}}/scripts/wavelet-construction.js"></script>
<script src="{{site.basurl}}/scripts/wavelet-graph.js"></script>
<script src="{{site.basurl}}/scripts/vanishing-moments.js"></script>
