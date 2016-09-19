---
title: "Composition"
type: pages
layout: splash
header:
  image: spiral-header.jpg
author_profile: false
permalink: /composition/
---

{% include base_path %}

<div class="grid__wrapper">
  {% for post in site.composition %}
    {% include archive-single.html type="grid" %}
  {% endfor %}
</div>
