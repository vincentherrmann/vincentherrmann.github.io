---
type: pages
layout: archive
author_profile: true
permalink: /blog/
---

{% include base_path %}

<div class="grid__wrapper">
  {% for post in site.blog | sort:"date" | reverse %}
    {% include archive-single.html type="grid" %}
  {% endfor %}
</div>

<!--from here just a test!!! -->

<h1>Latest posts</h1>
<div class="hfeed">

  {% for post in site.posts %}
    <article class="hentry entry">
      <h1 class="entry-title">
        <a href="{{ post.url }}" rel="bookmark">{{ post.title }}</a>
      </h1>
      <p>Posted on <time class="published" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date }}</time></p>
    </article>
  {% endfor %}

</div>
