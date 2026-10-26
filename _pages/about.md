---
layout: about
title: About
permalink: /
nav: false
nav_order: 1
subtitle:
profile:
  align: right
  image: website/prof_pic_7_21_26_sq.jpg
  hide: true
  image_circular: false # crops the image to make it cicular
  more_info:
    # false

news: false # includes a list of news items
social: true # includes social icons at the bottom of the page
# Research panel: selected papers (bib keys) shown under the map by default and listed first, in this order
pinned_research: [tang2026bvb]
# Skip heavy scripts not used on the landing page (see _includes/scripts/mathjax.liquid, masonry.liquid)
math: false
masonry: false
medium_zoom: true
table_enhance: false
# common.js 必须加载：主页 Research 面板的 Cite/Abs 按钮依赖它的展开逻辑
copy_code: false
jupyter: false
---

<div class="about-bio about-prompt" markdown="1">

Yolo Y. Tang is a final-year Ph.D. candidate at the [University of Rochester](https://www.rochester.edu/) (UR), advised by [Prof. Chenliang Xu](https://www.cs.rochester.edu/~cxu22/index.html), working on <a href="https://github.com/yunlong10/Awesome-LLMs-for-Video-Understanding">LMMs/Agents &times; Video Understanding</a>. She earned her M.S. from UR in 2025 en route to her Ph.D. and received her B.Eng. from [SUSTech](https://www.sustech.edu.cn/en/) in 2023. Yolo has interned at [Amazon](https://www.aboutamazon.com/), [ByteDance](https://www.bytedance.com/en/), and [Tencent](https://www.tencent.com/).
{: .about-bio-academic}

Yolo is drawing for fun, self-teaching and not open to paid commissions or commercial collaborations. She is also really into J-pop and cosplay — maybe she’s just cosplaying as a researcher :) Please don't deadname or misgender Yolo. She prefers Yolo (in English) or 悠洛 (Yōuluò in Mandarin and ゆら/Yura in Japanese).
{: .about-bio-creative}

Swipe left or right to explore the full map and click a node to show related papers.
{: .about-bio-panel .about-bio-research}

Select a tag to filter: <span class="about-gallery-filters" role="group" aria-label="Filter by tag">{%- assign gallery_tags = '' | split: '' -%}{%- for painting in site.data.paintings -%}{%- if painting.tags -%}{%- assign gallery_tags = gallery_tags | concat: painting.tags -%}{%- endif -%}{%- endfor -%}{%- assign gallery_tags = gallery_tags | uniq | sort -%}<button type="button" class="ig-filter" data-ig-filter="*" aria-selected="false">#All</button>{%- for tag in gallery_tags -%}{%- assign tag_key = tag | downcase %} <button type="button" class="ig-filter{% if tag_key == 'illustration' %} is-active{% endif %}" data-ig-filter="{{ tag_key }}" aria-selected="{% if tag_key == 'illustration' %}true{% else %}false{% endif %}">#{{ tag }}</button>{%- endfor -%}</span>
{: .about-bio-panel .about-bio-gallery}

Blogs are coming soon!
{: .about-bio-panel .about-bio-blog}

Yolo's latest updates, newest first.
{: .about-bio-panel .about-bio-news}

<p class="about-bio-search" markdown="0"><i class="ti ti-search about-search-icon" aria-hidden="true"></i><input type="text" class="about-prompt-search-input" role="combobox" placeholder="Search papers, illustrations, posts and news" autocomplete="off" spellcheck="false" aria-label="Search the site" aria-autocomplete="list" aria-expanded="false" aria-controls="about-search-results"></p>

<div class="about-prompt-actions" aria-label="Contact links">
  <div class="about-prompt-action-group">
  <button type="button" class="about-prompt-action about-prompt-more" aria-label="More links" title="More links" aria-expanded="false" aria-controls="about-prompt-action-list">
    <i class="fa-solid fa-plus" aria-hidden="true"></i>
  </button>
  <div class="about-prompt-action-list" id="about-prompt-action-list">
    <a
      href="https://scholar.google.com/citations?user={{ site.scholar_userid }}"
      class="about-prompt-action"
      aria-label="Google Scholar"
      title="Google Scholar"
      target="_blank"
      rel="noopener noreferrer"
      data-about-scholar-action
      data-scholar-href="https://scholar.google.com/citations?user={{ site.scholar_userid }}"
      data-scholar-label="Google Scholar"
      data-scholar-icon="ai ai-google-scholar"
      data-instagram-href="https://www.instagram.com/yoloytang.art/"
      data-instagram-label="Instagram"
      data-instagram-icon="fa-brands fa-instagram"
    >
      <i class="ai ai-google-scholar" aria-hidden="true"></i>
    </a>
    <a
      href="https://github.com/{{ site.github_username }}"
      class="about-prompt-action about-prompt-github"
      aria-label="GitHub"
      title="GitHub"
      target="_blank"
      rel="noopener noreferrer"
      data-about-github-action
      data-github-href="https://github.com/{{ site.github_username }}"
      data-github-label="GitHub"
      data-pixiv-href="https://pixiv.me/yoloytang"
      data-pixiv-label="Pixiv"
    >
      <i class="fa-brands fa-github" aria-hidden="true"></i>
      <svg class="about-prompt-pixiv-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#0096FA" d="M4.935 0A4.924 4.924 0 0 0 0 4.935v14.13A4.924 4.924 0 0 0 4.935 24h14.13A4.924 4.924 0 0 0 24 19.065V4.935A4.924 4.924 0 0 0 19.065 0zm7.81 4.547c2.181 0 4.058.676 5.399 1.847a6.118 6.118 0 0 1 2.116 4.66c.005 1.854-.88 3.476-2.257 4.563-1.375 1.092-3.225 1.697-5.258 1.697-2.314 0-4.46-.842-4.46-.842v2.718c.397.116 1.048.365.635.779H5.79c-.41-.41.19-.65.644-.779V7.666c-1.053.81-1.593 1.51-1.868 2.031.32 1.02-.284.969-.284.969l-1.09-1.73s3.868-4.39 9.553-4.39zm-.19.971c-1.423-.003-3.184.473-4.27 1.244v8.646c.988.487 2.484.832 4.26.832h.01c1.596 0 2.98-.593 3.93-1.533.952-.948 1.486-2.183 1.492-3.683-.005-1.54-.504-2.864-1.42-3.86-.918-.992-2.274-1.645-4.002-1.646Z"/></svg>
    </a>
    <a
      href="https://x.com/{{ site.x_username }}"
      class="about-prompt-action about-prompt-x"
      aria-label="X"
      title="X"
      target="_blank"
      rel="noopener noreferrer"
      data-about-x-action
      data-x-href="https://x.com/{{ site.x_username }}"
      data-x-creative-href="https://x.com/yoloytang_art"
    >
      <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
    </a>
    <a
      href="mailto:{{ site.email | encode_email }}"
      class="about-prompt-action about-prompt-email"
      aria-label="Email"
      title="Email"
      data-about-contact-action
      data-email-href="mailto:{{ site.email | encode_email }}"
      data-email-label="Email"
      data-email-icon="fa-regular fa-envelope"
    >
      <i class="fa-regular fa-envelope" aria-hidden="true"></i>
    </a>
    <a
      href="https://discord.com/users/1152784980167106662"
      class="about-prompt-action about-prompt-discord"
      aria-label="Discord"
      title="Discord"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="fa-brands fa-discord" aria-hidden="true"></i>
    </a>
  </div>
  </div>
  <nav class="about-quick-links" aria-label="Quick links">
    <a href="#about-research-panel" title="Research" data-about-panel-trigger="research" aria-expanded="false" aria-controls="about-research-panel">
      <i class="fa-regular fa-compass" aria-hidden="true"></i>
      <span class="quick-link-title">Research</span>
    </a>
    <a href="#about-gallery-panel" title="Gallery" data-about-panel-trigger="gallery" aria-expanded="false" aria-controls="about-gallery-panel">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <span class="quick-link-title">Gallery</span>
    </a>
    <a href="{{ '/blog/' | relative_url }}" title="Yo'Log" data-about-panel-trigger="blog" aria-expanded="false" aria-controls="about-blog-panel">
      <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
      <span class="quick-link-title">Yo'Log</span>
    </a>
  </nav>
  <details class="about-model-select">
    <summary aria-label="Yolo mode">
      <span class="about-model-variant" data-about-model-current>Academic</span>
      <span class="about-model-brand">Yolo</span>
    </summary>
    <div class="about-model-options" role="listbox" aria-label="Yolo mode options">
      <button type="button" role="option" aria-selected="true" data-about-model-value="Academic">
        <span class="about-model-variant">Academic</span>
        <span class="about-model-brand">Yolo</span>
      </button>
      <button type="button" role="option" aria-selected="false" data-about-model-value="Creative">
        <span class="about-model-variant">Creative</span>
        <span class="about-model-brand">Yolo</span>
      </button>
    </div>
  </details>
  <button type="button" class="about-prompt-action about-prompt-search" aria-label="Search" title="Search" aria-pressed="false">
    <svg class="about-prompt-search-disc" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="14" />
      <path
        transform="translate(5.72 5.72) scale(0.03232)"
        d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
      />
    </svg>
    <i class="fa-solid fa-circle-stop" aria-hidden="true"></i>
  </button>
</div>

<div id="about-search-results" class="about-search-results" role="listbox" aria-label="Search results" hidden></div>

</div>

<div class="about-panel-divider" aria-hidden="true"></div>

<section id="about-research-panel" class="about-inline-panel about-inline-research research-jp" data-about-panel="research" aria-label="Research" hidden>
  <div class="about-inline-panel-inner">
    {% include research_map.liquid %}
    {% include research_controls.liquid %}

    <div id="research-map-paper-panel" class="research-map-paper-panel" data-pinned-keys="{{ page.pinned_research | join: ',' }}" hidden>
      <div class="research-paper-status">
        <p class="research-paper-status-text" role="status"></p>
        <button type="button" class="research-paper-status-clear" hidden>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span>Clear filter</span>
        </button>
      </div>
      {% include selected_papers.liquid %}
    </div>

  </div>
</section>

<section id="about-gallery-panel" class="about-inline-panel about-inline-simple gallery-jp" data-about-panel="gallery" aria-label="Gallery" hidden>
  <div class="about-inline-panel-inner">
    {% include painting_gallery.liquid %}
  </div>
</section>

<section id="about-blog-panel" class="about-inline-panel about-inline-blog" data-about-panel="blog" aria-label="Yo'Log" hidden>
  <div class="about-inline-panel-inner">
    <ul class="post-list">
      {% for post in site.posts %}
        {% if post.external_source == blank %}
          {% assign read_time = post.content | number_of_words | divided_by: 180 | plus: 1 %}
        {% else %}
          {% assign read_time = post.feed_content | strip_html | number_of_words | divided_by: 180 | plus: 1 %}
        {% endif %}
        <li>
          <h3>
            {% if post.redirect == blank %}
              <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
            {% elsif post.redirect contains '://' %}
              <a class="post-title" href="{{ post.redirect }}" target="_blank" rel="noopener noreferrer">{{ post.title }}</a>
            {% else %}
              <a class="post-title" href="{{ post.redirect | relative_url }}">{{ post.title }}</a>
            {% endif %}
          </h3>
          <p>{{ post.description }}</p>
          <p class="post-meta">{{ read_time }} min read &nbsp; &middot; &nbsp; {{ post.date | date: '%B %d, %Y' }}</p>
        </li>
      {% endfor %}
    </ul>
  </div>
</section>

<section id="about-news-panel" class="about-inline-panel about-inline-news" data-about-panel="news" aria-label="News" hidden>
  <div class="about-inline-panel-inner">
    <ol class="about-news-list">
      {% assign news_items = site.news | sort: 'date' | reverse %}
      {% for item in news_items %}
        <li>
          <time class="about-news-date" datetime="{{ item.date | date: '%Y-%m-%d' }}">{{ item.date | date: '%m/%d/%y' }}</time>
          <div class="about-news-text">
            {% if item.inline %}
              {{ item.content | remove: '<p>' | remove: '</p>' | emojify }}
            {% else %}
              <a href="{{ item.url | relative_url }}">{{ item.title }}</a>
            {% endif %}
          </div>
        </li>
      {% endfor %}
    </ol>
  </div>
</section>

<!-- Please feel free to [contact me](/#social-links) if you're interested in collaboration! -->
