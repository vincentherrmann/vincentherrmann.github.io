---
type: pages
layout: single
header:
  image: home-header.jpg
author_profile: true
permalink: /
---

I am a PhD candidate at the Swiss AI Lab IDSIA, University of Lugano, where I work under the supervision of Prof. Jürgen Schmidhuber. 
My research centers on artificial curiosity, representation learning, reinforcement learning, and information theory, with the aim of uncovering criteria for determining the 'interestingness' of objects and developing effective representations for them. 
In addition to my academic pursuits, I am a classical pianist and composer.

[Academic CV](../assets/pdfs/Vincent_Herrmann_CV_2025.pdf)

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


## Research Projects

<div class="feature__wrapper">
{% assign recent_posts = site.blog | sort:"date" | reverse %}
{% for post in recent_posts limit: 2 %}
  {% include archive-single.html type="grid" %}
{% endfor %}

{% assign recent_posts = site.blog | where: "title", "more..." %}
{% for post in recent_posts limit: 1 %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>


## Piano

<div class="feature__wrapper">
{% assign recent_posts = site.piano | sort:"date" | reverse %}
{% for post in recent_posts limit: 2 %}
  {% include archive-single.html type="grid" %}
{% endfor %}

{% assign recent_posts = site.piano | where: "title", "more..." %}
{% for post in recent_posts limit: 1 %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>


## Composition
<div class="feature__wrapper">
{% assign recent_posts = site.composition | sort:"date" | reverse %}
{% for post in recent_posts limit: 2 %}
  {% include archive-single.html type="grid" %}
{% endfor %}

{% assign recent_posts = site.composition | where: "title", "more..." %}
{% for post in recent_posts limit: 1 %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>
