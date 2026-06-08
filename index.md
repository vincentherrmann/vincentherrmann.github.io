---
type: pages
layout: single
author_profile: true
permalink: /
classes: content-small
---

I am a PhD candidate at the Swiss AI Lab IDSIA, University of Lugano, where I work with my advisor Prof. Jürgen Schmidhuber. 
My research centers on artificial curiosity, representation learning, reinforcement learning, and information theory, with the aim of uncovering criteria for determining the "interestingness" of objects and developing effective representations for them. 
In addition to my academic pursuits, I am a classical pianist and composer.
Below, you can find a list of some of my research projects.

{% include base_path %}

{% for sec in site.data.projects %}
## {{ sec.section }}

{% if sec.section == "Interestingness, Open-Ended Learning, and Artificial Curiosity" %}
I believe that the challenge of interestingness is central to building open-ended, creative, and self-improving systems. I aim to understand what makes something interesting—both in theory, using tools from algorithmic information theory and Kolmogorov complexity, and in practice, by leveraging the in-context learning capabilities of LLMs.
{% elsif sec.section == "Understanding and Generating Neural Networks at the Weights Level" %}
The weights of a neural network are its program. They can also be treated as data. We can train models to generate, interpret, or modify these weights. While neural network weights offer a universal representational format, they present significant challenges: they are massively high-dimensional and rich with complex symmetries that we must learn to exploit.
{% elsif sec.section == "Creativity, Music, and Narratives" %}
I am deeply interested in the creative process—specifically, what defines a work of art, which aspects of the process can be automated, and which remain inherently human. These projects sit at the intersection of science, engineering, and art, exploring how far we can push the boundaries of computational creativity.
{% endif %}

<div class="project-list">
  {% for proj in sec.projects %}
    <div class="project-item">
      <div class="project-left">
        {% if proj.image %}
          <div class="project-teaser">
            <img src="{{ proj.image | prepend: '/images/' | prepend: base_path }}" alt="{{ proj.title }}">
          </div>
        {% endif %}
        {% if proj.venue %}
          <span class="project-venue">{{ proj.venue }}</span>
        {% endif %}
        {% if proj.paper %}
          <a href="{% if proj.paper contains '://' %}{{ proj.paper }}{% else %}{{ proj.paper | prepend: base_path }}{% endif %}" class="project-paper-link">paper</a>
        {% endif %}
      </div>
      <div class="project-body">
        <h3 class="project-title">
          {% if proj.link %}
            <a href="{{ proj.link | prepend: base_path }}">{{ proj.title }}</a>
          {% else %}
            {{ proj.title }}
          {% endif %}
        </h3>
        {% if proj.link %}
          {% assign project_post = site.blog | where: "url", proj.link | first %}
          {% if project_post and project_post.authors %}
            <div class="project-authors">{{ project_post.authors }}</div>
          {% endif %}
        {% endif %}
        <p class="project-description">{{ proj.description }}</p>
      </div>
    </div>
  {% endfor %}
</div>
{% endfor %}