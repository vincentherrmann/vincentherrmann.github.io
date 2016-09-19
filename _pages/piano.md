---
title: "Piano"
type: pages
layout: splash
header:
  image: hands-header.jpg
author_profile: false
permalink: /piano/
---

{% include base_path %}

<div class="grid__wrapper">
  {% for post in site.piano %}
    {% include archive-single.html type="grid" %}
  {% endfor %}
</div>
