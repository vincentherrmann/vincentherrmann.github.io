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

<div class="feature__wrapper">
{% assign recent_posts = site.composition | sort:"date" | reverse %}
{% for post in recent_posts %}
  {% if post.title contains 'more...'%}
  {% else %}
    {% include archive-single.html type="grid" %}
  {% endif %}
{% endfor %}
</div>
