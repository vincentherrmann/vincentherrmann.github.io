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
gui:
 - image_path: immersions/gui.png

nodes_gif:
 - image_path: immersions/nodes.gif

connections_gif:
 - image_path: immersions/connections.gif
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

### Activation selection
{% include youtube-player.html id=page.youtubeID3 %}

### GUI
{% include gallery id="gui"%}
