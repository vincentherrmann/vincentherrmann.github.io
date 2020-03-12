---
title: "Immersions"
description: "Visualizing and sonifying how an artificial ear hears music"
type: pages
layout: splash
author_profile: false
header:
  image: immersions/immersions_header.png
permalink: /demos/immersions
youtubeID1: "D7v1uVH_MSk"
youtubeID2: "kEjAZEUFPcI"
youtubeID3: "B65WTvFB--4"
youtubeNeuralLayoutHouse: "vxjq58dAG94"
youtubeNeuralLayoutVGG: "SWlDVlyZ4R8"
youtubeNeuralLayoutResNet: "qzvSUATPOB4"
youtubeImmersionsZoomed: "PV7eAF41qV0"
youtubeImmersionsUnmodified: "bsxYVDbmWfo"
youtubeImmersionsModified: "aBkHO6oV-Mc"
gui:
 - image_path: immersions/gui_new.png

nodes_gif:
 - image_path: immersions/activations.gif

connections_gif:
 - image_path: immersions/connections_new.gif

live_gif:
 - image_path: immersions/live_activations.gif

g1:
 - image_path: ../images/immersions/clip_visualizations/house_3_ar_block_0_ch_0_1_from_low_noise_selection.png
 - image_path: ../images/immersions/clip_visualizations/house_3_ar_block_0_ch_0_1_from_low_noise.png

---
# Immersions
## Visualizing and sonifying how an artificial ear hears music

Immersions is a system that lets us interact with and explore an audio processing neural network, or what I call an "artificial ear".
There are two main aspects of this project - one is visual, the other is sonic.
For the visualization, first the neurons of the network are laid out in 2D, then their activation is shown at every moment, depending on the input.
To make audible how music sound to the artificial ear an optimization procedure generates sounds that that specifically activate certain neurons in the network.
For more informations, please the the paper or the poster, as well as the visualization code (that you could use to visualize your own networks)!


[Paper](https://neurips2019creativity.github.io/doc/Immersions_NeurIPS.pdf)

[Poster](/assets/pdfs/Immersions_Poster.pdf)

[Neural layout & visualization code](https://github.com/vincentherrmann/neural-layout)

{% include gallery id="g1" layout="half" %}

{% include gallery id="g1" layout="third" %}

{% include gallery id="g1" %}

<div class="row">
  <div class="column">
    <img src="../images/immersions/clip_visualizations/house_3_ar_block_0_ch_0_1_from_low_noise_selection.png" width="300" height="300">
  </div>
  <div class="column">
    <img src="../images/immersions/clip_visualizations/house_3_ar_block_0_ch_0_1_from_low_noise.png" width="300" height="300">
  </div>
</div>



<audio controls>
  <source src="../assets/audio/immersions/house_3_ar_block_1_ch_0_1_from_low_noise.mp3" type="audio/mp3">
</audio>

<audio controls>
  <source src="../assets/audio/immersions/house_3_scalogram.mp3" type="audio/mp3">
</audio>

<audio controls>
  <source src="../assets/audio/immersions/house_3_encoder_block_0_conv_1_ch_0_1_from_low_noise.mp3" type="audio/mp3">
</audio>



## Finding the layout of the neural network
### Immersions model architecture
{% include youtube-player.html id=page.youtubeNeuralLayoutHouse %}

### VGG 16 architecture
{% include youtube-player.html id=page.youtubeNeuralLayoutVGG %}

### ResNet 18 architecture
{% include youtube-player.html id=page.youtubeNeuralLayoutResNet %}

## Other visualizations

### Network connections
{% include gallery id="connections_gif"%}

### Network nodes
{% include gallery id="nodes_gif"%}

### Live activations
{% include gallery id="live_gif"%}

## Input optimization examples
### Original input
{% include youtube-player.html id=page.youtubeImmersionsUnmodified %}

### Optimized input for selected neurons
{% include youtube-player.html id=page.youtubeImmersionsZoomed %}

### Full view of optimized input
{% include youtube-player.html id=page.youtubeImmersionsModified %}

### GUI
{% include gallery id="gui"%}
