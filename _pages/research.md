---
title: "Research Projects"
type: pages
layout: archive
author_profile: true
permalink: /research/
---

<div class="feature__wrapper">
{% assign recent_posts = site.blog | sort:"date" | reverse %}
{% for post in recent_posts %}
  {% if post.title contains 'more...'%}
  {% else %}
    {% include archive-single.html type="grid" %}
  {% endif %}
{% endfor %}
</div>
