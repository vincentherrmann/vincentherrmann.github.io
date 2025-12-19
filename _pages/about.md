---
title: "About"
type: pages
layout: single
author_profile: true
permalink: /about/
related: false

portrait:
 - image_path: SUPSI_DTI_140623_HiRes-1535356.jpg
---

<div>
<img src="../images/SUPSI_DTI_140623_HiRes-1535356.jpg" width="300" ALIGN="right" HSPACE="30"/>
</div>

I am a PhD candidate at the Swiss AI Lab IDSIA, University of Lugano, working under the supervision of Prof. Jürgen Schmidhuber. 
My research focuses on artificial curiosity, representation learning, reinforcement learning, and information theory. 
My goal is to discover criteria for identifying the interestingness of objects and to develop effective representations for them. 
I am also a classical pianist and composer.

[Academic CV](../assets/pdfs/CV_Vincent_Herrmann_2025.pdf)

### Recent News
<div class="feature__wrapper">
{% assign recent_posts = site.news | sort:"date" | reverse %}
{% for post in recent_posts limit: 2 %}
  {% include archive-single.html type="grid" %}
{% endfor %}

{% assign recent_posts = site.blog | where: "title", "more..." %}
{% for post in recent_posts limit: 1 %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>

