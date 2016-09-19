---
type: pages
layout: archive
author_profile: true
permalink: /blog/
---

{% include base_path %}

<div class="grid__wrapper">
  {% for post in site.posts %}
    {% include archive-single.html type="grid" %}
  {% endfor %}
</div>
