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

<div class="feature__wrapper">
{% assign recent_posts = site.piano | sort:"date" | reverse %}
{% for post in recent_posts %}
  {% if post.title contains 'more...'%}
  {% else %}
    {% include archive-single.html type="grid" %}
  {% endif %}
{% endfor %}
</div>
