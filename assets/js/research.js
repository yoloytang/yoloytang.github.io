(function () {
  var trigger = document.getElementById("research-map-trigger");
  if (!trigger) return;

  var mapShell = document.querySelector(".research-map-shell");
  var scrollLeft = mapShell ? mapShell.querySelector(".research-map-scroll-left") : null;
  var scrollRight = mapShell ? mapShell.querySelector(".research-map-scroll-right") : null;
  var mapRail = mapShell ? mapShell.querySelector(".research-map-rail") : null;
  var mapRailThumb = mapRail ? mapRail.querySelector(".research-map-rail-thumb") : null;
  var paperPanel = document.getElementById("research-map-paper-panel");
  var paperClose = paperPanel ? paperPanel.querySelector(".research-map-paper-close") : null;
  var paperStatus = paperPanel ? paperPanel.querySelector(".research-paper-status") : null;
  var paperStatusText = paperStatus ? paperStatus.querySelector(".research-paper-status-text") : null;
  var paperStatusClear = paperStatus ? paperStatus.querySelector(".research-paper-status-clear") : null;
  var selectedPubs = document.getElementById("selected-publications");
  var bibSearch = document.getElementById("bibsearch");
  var sortSelect = document.getElementById("pub-sort-by");
  var sortToggle = document.querySelector(".research-sort-toggle");
  var sortCurrent = sortToggle ? sortToggle.querySelector(".research-sort-current") : null;
  var sortMenu = document.getElementById("research-sort-menu");
  var sortOptions = sortMenu ? Array.prototype.slice.call(sortMenu.querySelectorAll("[data-sort-value]")) : [];
  var controls = document.querySelector(".research-controls");
  var controlButtons = Array.prototype.slice.call(document.querySelectorAll(".research-control-button[data-research-control]"));
  var sortButtonLabel = document.querySelector('.research-control-button[data-research-control="sort"] span');
  var paperPanelTimer = null;
  var paperPanelHeightTimer = null;
  var paperPanelTransitionMs = 860;
  var paperPanelScrollMs = 980;

  function isPaperPanelVisible() {
    return paperPanel && !paperPanel.hidden && paperPanel.classList.contains("is-visible");
  }

  function setPaperPanelHeightToContent() {
    if (!isPaperPanelVisible()) return;
    paperPanel.style.setProperty("--research-paper-panel-height", paperPanel.scrollHeight + "px");
  }

  function releasePaperPanelHeight() {
    if (!isPaperPanelVisible()) return;
    paperPanel.style.setProperty("--research-paper-panel-height", "none");
  }

  function schedulePaperPanelHeightRelease() {
    window.clearTimeout(paperPanelHeightTimer);
    paperPanelHeightTimer = window.setTimeout(releasePaperPanelHeight, paperPanelTransitionMs + 80);
  }

  function refreshPaperPanelHeight() {
    setPaperPanelHeightToContent();
    schedulePaperPanelHeightRelease();
  }

  function allPaperItems() {
    if (!selectedPubs) return [];
    return Array.prototype.slice.call(selectedPubs.querySelectorAll("ol.bibliography > li"));
  }

  function paperItemForKey(key) {
    if (!selectedPubs || !key) return null;
    var entry = document.getElementById(key);
    return entry && selectedPubs.contains(entry) ? entry.closest("li") : null;
  }

  function parseKeys(raw) {
    return (raw || "")
      .split(",")
      .map(function (key) {
        return key.trim();
      })
      .filter(Boolean);
  }

  var pinnedKeys = parseKeys(paperPanel && paperPanel.getAttribute("data-pinned-keys"));

  function pinnedPaperItems() {
    return pinnedKeys.map(paperItemForKey).filter(Boolean);
  }

  function withPinnedFirst(items) {
    var pinned = pinnedPaperItems().filter(function (li) {
      return items.indexOf(li) !== -1;
    });
    return pinned.concat(
      items.filter(function (li) {
        return pinned.indexOf(li) === -1;
      })
    );
  }

  // Shows only `items`. Without an explicit sort they are reordered with pinned
  // papers first; an explicit sort owns the order (see selected_papers.liquid).
  function showPaperItems(items) {
    var itemSet = new Set(items);
    allPaperItems().forEach(function (li) {
      li.hidden = !itemSet.has(li);
    });
    var list = items[0] && items[0].parentElement;
    if (!list || !isDefaultSort()) return;
    withPinnedFirst(items).forEach(function (li) {
      list.appendChild(li);
    });
  }

  // What narrows the list right now: { label } for a topic node, { query } for a search.
  var paperFilter = null;
  var paperStatusKey = "";

  function visiblePaperCount() {
    return allPaperItems().filter(function (li) {
      return !li.hidden && !li.classList.contains("unloaded");
    }).length;
  }

  function nodeLabel(node) {
    return Array.prototype.map
      .call(node.querySelectorAll(".rm-name, .rm-label"), function (el) {
        return el.textContent.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean)
      .join(" ");
  }

  function renderPaperStatus() {
    if (!paperStatus || !paperStatusText) return;
    var count = paperFilter ? visiblePaperCount() : 0;
    var label = !paperFilter ? "" : paperFilter.query ? "\u201c" + paperFilter.query + "\u201d" : paperFilter.label;
    var isEmpty = !!(paperFilter && paperFilter.query && !count);
    // Unchanged text is left alone so the role="status" region isn't re-announced.
    var key = paperFilter ? label + "|" + count : "";
    if (key === paperStatusKey) return;
    paperStatusKey = key;

    paperStatus.classList.toggle("is-active", !!paperFilter);
    paperStatus.classList.toggle("is-empty", isEmpty);
    if (paperStatusClear) {
      paperStatusClear.hidden = !paperFilter;
      paperStatusClear.setAttribute("aria-label", "Clear filter");
    }
    paperStatusText.textContent = "";
    if (!paperFilter) return;
    if (isEmpty) {
      paperStatusText.textContent = "No papers match " + label + ".";
      return;
    }
    var labelEl = document.createElement("span");
    labelEl.className = "research-paper-status-label";
    labelEl.textContent = label;
    paperStatusText.appendChild(labelEl);
    var countEl = document.createElement("span");
    countEl.className = "research-paper-status-count";
    countEl.textContent = " \u00b7 " + (count === 1 ? "1 paper" : count + " papers");
    paperStatusText.appendChild(countEl);
  }

  function setPaperFilter(filter) {
    paperFilter = filter;
    renderPaperStatus();
  }

  // Papers that should only surface via the "Others" node, not in the hub
  // (LMMs/Agents x Video Understanding) "all papers" view.
  var OTHERS_ONLY_KEYS = ["tang2025ai4anime", "hua2024mmcomposition", "wang2023caption"];

  function hubPaperItems() {
    var excluded = new Set();
    OTHERS_ONLY_KEYS.forEach(function (key) {
      var li = paperItemForKey(key);
      if (li) excluded.add(li);
    });
    return allPaperItems().filter(function (li) {
      return !excluded.has(li);
    });
  }

  function paperKeysForNode(node) {
    if (!node) return [];
    return parseKeys(node.getAttribute("data-paper-keys") || node.getAttribute("data-paper-key"));
  }

  function parseCount(val) {
    if (val == null || val === "") return 0;
    var n = parseInt(String(val).replace(/,/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }

  function isDefaultSort() {
    return !sortSelect || sortSelect.value === "default";
  }

  function defaultOrderedItems(items) {
    var shuffledItems = items.slice();
    for (var i = shuffledItems.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffledItems[i];
      shuffledItems[i] = shuffledItems[j];
      shuffledItems[j] = tmp;
    }
    return shuffledItems;
  }

  function paperItemsForNode(node) {
    if (!node) return [];
    if (node.getAttribute("data-paper-mode") === "all-cites") {
      if (isDefaultSort()) return defaultOrderedItems(hubPaperItems());
      return hubPaperItems().sort(function (a, b) {
        var ar = a.querySelector(".row");
        var br = b.querySelector(".row");
        return parseCount(br && br.getAttribute("data-sort-cites")) - parseCount(ar && ar.getAttribute("data-sort-cites"));
      });
    }
    var items = paperKeysForNode(node)
      .map(paperItemForKey)
      .filter(function (item, idx, arr) {
        return item && arr.indexOf(item) === idx;
      });
    if (isDefaultSort()) return defaultOrderedItems(items);
    return items;
  }

  function hidePaperPanel() {
    if (!paperPanel) return;
    setPaperFilter(null);
    window.clearTimeout(paperPanelTimer);
    window.clearTimeout(paperPanelHeightTimer);
    if (!paperPanel.hidden) {
      paperPanel.style.setProperty("--research-paper-panel-height", paperPanel.scrollHeight + "px");
      window.requestAnimationFrame(function () {
        paperPanel.classList.remove("is-visible");
        paperPanel.style.setProperty("--research-paper-panel-height", "0px");
      });
    }
    document.querySelectorAll(".rm-station.active, .rm-topic.active").forEach(function (node) {
      node.classList.remove("active");
    });
    paperPanelTimer = window.setTimeout(function () {
      if (paperPanel.classList.contains("is-visible")) return;
      paperPanel.hidden = true;
      allPaperItems().forEach(function (li) {
        li.hidden = true;
      });
    }, paperPanelTransitionMs);
  }

  function revealPaperPanel(shouldScroll) {
    if (!paperPanel) return;
    window.clearTimeout(paperPanelTimer);
    var wasVisible = !paperPanel.hidden && paperPanel.classList.contains("is-visible");
    paperPanel.hidden = false;
    if (!wasVisible) {
      paperPanel.classList.remove("is-visible");
      paperPanel.style.setProperty("--research-paper-panel-height", "0px");
    }

    window.requestAnimationFrame(function () {
      paperPanel.style.setProperty("--research-paper-panel-height", paperPanel.scrollHeight + "px");
      paperPanel.classList.add("is-visible");
      schedulePaperPanelHeightRelease();
      if (shouldScroll) {
        window.setTimeout(
          function () {
            slowScrollToPanel();
          },
          wasVisible ? 180 : 420
        );
      }
    });
  }

  // Most cited first; ties go to the better author position, then the newer paper.
  function byCitations(items) {
    function sortValue(li, name) {
      var row = li.querySelector(".row");
      return parseCount(row && row.getAttribute(name));
    }
    return items.slice().sort(function (a, b) {
      return (
        sortValue(b, "data-sort-cites") - sortValue(a, "data-sort-cites") ||
        (sortValue(a, "data-sort-author-pos") || 999) - (sortValue(b, "data-sort-author-pos") || 999) ||
        sortValue(b, "data-sort-year") - sortValue(a, "data-sort-year")
      );
    });
  }

  // With nothing selected, the list shows every paper on the map (the hub's and the
  // Others'), by citations, with pinned papers kept on top.
  function showDefaultPapers() {
    var items = allPaperItems();
    if (!items.length) {
      hidePaperPanel();
      return;
    }
    document.querySelectorAll(".rm-station.active, .rm-topic.active").forEach(function (node) {
      node.classList.remove("active");
    });
    showPaperItems(byCitations(items));
    setPaperFilter(null);
    revealPaperPanel(false);
  }

  function slowScrollToPanel() {
    if (!paperPanel) return;
    var startY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var panelTop = paperPanel.getBoundingClientRect().top + startY;
    var headerOffset = Math.min(window.innerHeight * 0.12, 96);
    var targetY = Math.max(panelTop - headerOffset, 0);
    var distance = targetY - startY;
    if (Math.abs(distance) < 8) return;

    var startTime = null;
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / paperPanelScrollMs, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  function showPapersForSearch() {
    if (!paperPanel || !bibSearch) return;
    if (!bibSearch.value.trim()) {
      showDefaultPapers();
      return;
    }

    setControlMode("search");
    showPaperItems(allPaperItems());
    document.querySelectorAll(".rm-station.active, .rm-topic.active").forEach(function (node) {
      node.classList.remove("active");
    });
    setPaperFilter({ query: bibSearch.value.trim() });
    revealPaperPanel(false);
  }

  function clearBibSearch() {
    if (!bibSearch) return;
    bibSearch.value = "";
    document.querySelectorAll(".bibliography, .unloaded").forEach(function (element) {
      element.classList.remove("unloaded");
    });
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function setControlMode(mode) {
    var wasSortActive = controls && controls.classList.contains("mode-sort");
    if (controls) {
      controls.classList.toggle("mode-search", mode === "search");
      controls.classList.toggle("mode-sort", mode === "sort");
    }
    controlButtons.forEach(function (button) {
      var control = button.getAttribute("data-research-control");
      button.setAttribute("aria-pressed", control === mode ? "true" : "false");
      button.classList.toggle("active", control === mode);
    });
    if (sortButtonLabel) sortButtonLabel.textContent = mode === "sort" ? "Sort by" : "Sort";
    if (mode !== "sort") closeSortMenu(false);
    if (mode === "search" && bibSearch) {
      window.setTimeout(function () {
        bibSearch.focus();
      }, 0);
    }
    if (mode === "sort" && sortSelect) {
      window.setTimeout(function () {
        (sortToggle || sortSelect).focus();
      }, 0);
      if (!wasSortActive) {
        if (sortSelect.value === "default") sortSelect.value = "cites";
        sortSelect.dispatchEvent(new Event("change"));
      }
    }
  }

  function resetResearchFilters() {
    clearBibSearch();
    if (sortSelect) {
      sortSelect.value = "default";
      sortSelect.dispatchEvent(new Event("change"));
    }
    showDefaultPapers();
    setControlMode(null);
  }

  function showPapersForNode(node) {
    if (!paperPanel || !node) return false;
    clearBibSearch();
    if (controls) {
      controls.classList.remove("mode-search");
      controls.classList.remove("mode-sort");
    }
    controlButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("active");
    });
    if (sortButtonLabel) sortButtonLabel.textContent = "Sort";
    closeSortMenu(false);
    var keys = paperKeysForNode(node);
    var items = paperItemsForNode(node);
    if (!items.length) return false;

    showPaperItems(items);
    document.querySelectorAll(".rm-station.active, .rm-topic.active").forEach(function (n) {
      n.classList.remove("active");
    });
    keys.forEach(function (key) {
      document.querySelectorAll('.rm-station[data-paper-key="' + key + '"]').forEach(function (station) {
        station.classList.add("active");
      });
    });
    node.classList.add("active");
    if (sortSelect && !isDefaultSort()) sortSelect.dispatchEvent(new Event("change"));
    setPaperFilter({ label: nodeLabel(node) });
    revealPaperPanel(true);
    return true;
  }

  // A paper's node on the map, or a paper chosen in site search (window.revealResearchPaper,
  // via about.liquid), scrolls the list to that paper and flashes it, rather than narrowing
  // the list to it. A paper the list isn't showing (another node's papers, a search) brings
  // the whole list back first.
  var paperRequestId = 0;

  function showPaper(key) {
    var li = paperItemForKey(key);
    if (!li) return false;
    if (!isPaperPanelVisible() || li.hidden || li.classList.contains("unloaded")) {
      clearBibSearch();
      setControlMode(null);
      showDefaultPapers();
    }
    // Faded in already, not only once the scroll brings it into view.
    li.classList.add("niji-revealed");
    // Lazy teasers before it would re-flow the masonry after the scroll; load them first.
    var items = allPaperItems();
    var pending = [];
    items.slice(0, items.indexOf(li) + 1).forEach(function (item) {
      item.querySelectorAll("img").forEach(function (img) {
        img.loading = "eager";
        if (img.complete) return;
        pending.push(
          new Promise(function (resolve) {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve);
          })
        );
      });
    });
    var request = ++paperRequestId;
    var timeout = new Promise(function (resolve) {
      window.setTimeout(resolve, 800);
    });
    Promise.race([Promise.all(pending), timeout]).then(function () {
      if (request !== paperRequestId) return;
      followPaper(li);
    });
    return true;
  }

  // Late teaser loads re-flow the masonry, and the browser can drop a smooth scroll while the
  // page is busy. So for a few seconds, whenever scrolling has come to rest with the card out
  // of place, glide to it again; any user input stops this (as for gallery search hits). The
  // card flashes once the scroll has brought it there, so the flash isn't spent on the way.
  var paperFollow = null;
  var paperFollowStopEvents = ["wheel", "touchstart", "keydown", "pointerdown"];

  // The flash class comes off once it has played (2.8s, card-hit-glow in _base.scss):
  // a card hidden and shown again, as a filter does, would otherwise replay it.
  var paperFlash = null;

  function flashPaper(li) {
    if (paperFlash) {
      window.clearTimeout(paperFlash.timer);
      paperFlash.li.classList.remove("is-map-hit");
    }
    li.classList.remove("is-map-hit");
    void li.offsetWidth;
    li.classList.add("is-map-hit");
    paperFlash = {
      li: li,
      timer: window.setTimeout(function () {
        li.classList.remove("is-map-hit");
        paperFlash = null;
      }, 2800),
    };
  }

  function stopPaperFollow() {
    if (!paperFollow) return;
    window.clearInterval(paperFollow.timer);
    paperFollowStopEvents.forEach(function (type) {
      window.removeEventListener(type, stopPaperFollow);
    });
    paperFollow = null;
  }

  function followPaper(li) {
    stopPaperFollow();
    // 16px below the docked prompt card, leaving out the slide of the card's scroll-in reveal
    // (nijigen_motion.js), which may still be running.
    function offset() {
      var card = document.querySelector(".about-prompt");
      var cardBottom = card ? (parseFloat(window.getComputedStyle(card).top) || 60) + card.offsetHeight : 60;
      var slide = parseFloat((window.getComputedStyle(li).translate || "").split(" ")[1]) || 0;
      return li.getBoundingClientRect().top - slide - cardBottom - 16;
    }
    function glide() {
      window.scrollTo({ top: window.scrollY + offset(), behavior: "smooth" });
    }
    // In place, or as near as the page scrolls (the last cards can't reach the top).
    function arrived() {
      var off = offset();
      if (Math.abs(off) <= 2) return true;
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      return off > 0 ? window.scrollY >= maxY - 1 : window.scrollY <= 0;
    }
    var flashed = false;
    function flashOnce() {
      if (flashed) return;
      flashed = true;
      flashPaper(li);
    }
    var lastY = window.scrollY;
    var until = Date.now() + 4000;
    var follow = (paperFollow = {
      timer: window.setInterval(function () {
        if (Date.now() > until) {
          flashOnce();
          return stopPaperFollow();
        }
        var resting = window.scrollY === lastY;
        lastY = window.scrollY;
        if (!resting) return;
        if (arrived()) flashOnce();
        else glide();
      }, 150),
    });
    // After the keydown that may have chosen the node has finished reaching the window.
    window.setTimeout(function () {
      if (paperFollow !== follow) return;
      paperFollowStopEvents.forEach(function (type) {
        window.addEventListener(type, stopPaperFollow, { passive: true });
      });
    }, 0);
    glide();
  }

  function activateMapNode(node, event) {
    if (!node) return;
    if (event) event.preventDefault();
    if (node.classList.contains("rm-station")) showPaper(node.getAttribute("data-paper-key"));
    else showPapersForNode(node);
  }

  window.revealResearchPaper = showPaper;

  var panState = null;
  var PAN_THRESHOLD = 6;

  function mapCanPan() {
    return trigger.scrollWidth > trigger.clientWidth + 1;
  }

  function updateMapPanCursor() {
    trigger.classList.toggle("is-pannable", mapCanPan());
    updateMapRail();
  }

  // The thumb is a short, fixed-length run of line (its length is set in CSS): only its
  // position shows how far the map has scrolled, not how much of the map is in view.
  function mapRailMetrics() {
    return {
      travel: Math.max(mapRail.clientWidth - mapRailThumb.offsetWidth, 0),
      scrollable: trigger.scrollWidth - trigger.clientWidth,
    };
  }

  function updateMapRail() {
    if (!mapRailThumb || !mapCanPan()) return;
    var metrics = mapRailMetrics();
    mapRailThumb.style.transform = "translateX(" + metrics.travel * (trigger.scrollLeft / metrics.scrollable) + "px)";
  }

  var railGrabOffset = 0;

  function scrollMapFromRail(clientX) {
    var metrics = mapRailMetrics();
    if (!metrics.travel) return;
    var x = clientX - mapRail.getBoundingClientRect().left - railGrabOffset;
    trigger.scrollLeft = Math.min(Math.max(x / metrics.travel, 0), 1) * metrics.scrollable;
  }

  if (mapRail && mapRailThumb) {
    trigger.addEventListener("scroll", updateMapRail, { passive: true });
    mapRail.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var thumbRect = mapRailThumb.getBoundingClientRect();
      var onThumb = e.clientX >= thumbRect.left && e.clientX <= thumbRect.right;
      // Grabbing the thumb keeps it under the pointer; clicking the track centres it there.
      railGrabOffset = onThumb ? e.clientX - thumbRect.left : thumbRect.width / 2;
      try {
        mapRail.setPointerCapture(e.pointerId);
      } catch (err) {}
      mapRail.classList.add("is-dragging");
      scrollMapFromRail(e.clientX);
    });
    mapRail.addEventListener("pointermove", function (e) {
      if (mapRail.classList.contains("is-dragging")) scrollMapFromRail(e.clientX);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (type) {
      mapRail.addEventListener(type, function () {
        mapRail.classList.remove("is-dragging");
      });
    });
  }

  function endMapPan(event) {
    if (!panState) return;
    if (event && event.pointerId !== panState.pointerId) return;
    if (panState.pointerId != null) {
      try {
        trigger.releasePointerCapture(panState.pointerId);
      } catch (err) {}
    }
    trigger._suppressClick = panState.moved;
    trigger.classList.remove("is-panning");
    panState = null;
  }

  trigger.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (!mapCanPan()) return;
    panState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: trigger.scrollLeft,
      moved: false,
    };
  });
  trigger.addEventListener("pointermove", function (e) {
    if (!panState || e.pointerId !== panState.pointerId) return;
    var dx = e.clientX - panState.startX;
    if (!panState.moved) {
      if (Math.abs(dx) < PAN_THRESHOLD) return;
      panState.moved = true;
      trigger.classList.add("is-panning");
      try {
        trigger.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    e.preventDefault();
    trigger.scrollLeft = panState.startScroll - dx;
  });
  trigger.addEventListener("pointerup", endMapPan);
  trigger.addEventListener("pointercancel", endMapPan);
  trigger.addEventListener(
    "click",
    function (e) {
      if (!trigger._suppressClick) return;
      trigger._suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  trigger.addEventListener("click", function (e) {
    activateMapNode(e.target.closest(".rm-station, .rm-topic"), e);
  });
  trigger.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var mapNode = e.target.closest(".rm-station, .rm-topic");
    if (!mapNode) return;
    activateMapNode(mapNode, e);
  });
  if (scrollLeft) {
    scrollLeft.addEventListener("click", function (e) {
      e.stopPropagation();
      trigger.scrollBy({ left: -Math.round(trigger.clientWidth * 0.72), behavior: "smooth" });
    });
  }
  if (scrollRight) {
    scrollRight.addEventListener("click", function (e) {
      e.stopPropagation();
      trigger.scrollBy({ left: Math.round(trigger.clientWidth * 0.72), behavior: "smooth" });
    });
  }
  if (paperClose) paperClose.addEventListener("click", hidePaperPanel);
  if (paperStatusClear) {
    paperStatusClear.addEventListener("click", function () {
      if (paperFilter && paperFilter.query && bibSearch) {
        clearBibSearch();
        // Same path as deleting the text by hand, so bibsearch.js also drops its filter.
        bibSearch.dispatchEvent(new Event("input"));
        bibSearch.focus();
        return;
      }
      showDefaultPapers();
    });
  }
  // bibsearch.js hides non-matching papers after its own debounce, so recount
  // whenever visibility in the list changes rather than right after our updates.
  if (selectedPubs && paperStatus && "MutationObserver" in window) {
    var paperStatusFrame = 0;
    new MutationObserver(function () {
      if (!paperFilter || paperStatusFrame) return;
      paperStatusFrame = window.requestAnimationFrame(function () {
        paperStatusFrame = 0;
        renderPaperStatus();
      });
    }).observe(selectedPubs, { subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  }
  controlButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var control = button.getAttribute("data-research-control");
      if (control === "reset") {
        resetResearchFilters();
        return;
      }
      setControlMode(button.classList.contains("active") ? null : control);
    });
  });
  // The sort menu is our own listbox; the hidden <select> stays the source of truth that
  // the sorting code listens to. (A native select's menu is drawn by the OS and lands in
  // the wrong place in scaled previews.)
  function syncSortMenu() {
    if (!sortSelect) return;
    var value = sortSelect.value;
    sortOptions.forEach(function (option) {
      option.setAttribute("aria-selected", option.getAttribute("data-sort-value") === value ? "true" : "false");
    });
    var selected = sortSelect.options[sortSelect.selectedIndex];
    if (sortCurrent && value !== "default" && selected) sortCurrent.textContent = selected.textContent;
  }

  function openSortMenu() {
    if (!sortMenu || !sortToggle) return;
    syncSortMenu();
    var pill = sortToggle.closest(".research-control-pill");
    if (pill && controls) {
      sortMenu.style.right = Math.max(0, controls.getBoundingClientRect().right - pill.getBoundingClientRect().right) + "px";
    }
    sortMenu.hidden = false;
    sortToggle.setAttribute("aria-expanded", "true");
    (sortMenu.querySelector('[aria-selected="true"]') || sortOptions[0]).focus();
  }

  function closeSortMenu(returnFocus) {
    if (!sortMenu || sortMenu.hidden) return;
    sortMenu.hidden = true;
    sortToggle.setAttribute("aria-expanded", "false");
    if (returnFocus) sortToggle.focus();
  }

  if (sortSelect && sortToggle && sortMenu) {
    sortSelect.addEventListener("change", syncSortMenu);
    sortToggle.addEventListener("click", function () {
      if (sortMenu.hidden) openSortMenu();
      else closeSortMenu(true);
    });
    sortOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        sortSelect.value = option.getAttribute("data-sort-value");
        sortSelect.dispatchEvent(new Event("change"));
        closeSortMenu(true);
      });
    });
    sortMenu.addEventListener("keydown", function (e) {
      var index = sortOptions.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var step = e.key === "ArrowDown" ? 1 : -1;
        sortOptions[(index + step + sortOptions.length) % sortOptions.length].focus();
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        sortOptions[e.key === "Home" ? 0 : sortOptions.length - 1].focus();
      } else if (e.key === "Escape") {
        // Keep Escape from also closing the homepage panel.
        e.stopPropagation();
        closeSortMenu(true);
      } else if (e.key === "Tab") {
        closeSortMenu(false);
      }
    });
    document.addEventListener("pointerdown", function (e) {
      if (!sortMenu.hidden && !sortMenu.contains(e.target) && !sortToggle.contains(e.target)) closeSortMenu(false);
    });
  }

  if (bibSearch) {
    bibSearch.addEventListener("input", showPapersForSearch);
    window.addEventListener("hashchange", function () {
      window.setTimeout(showPapersForSearch, 0);
    });
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(showPapersForSearch, 0);
    });
  }
  if (paperPanel) {
    paperPanel.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", refreshPaperPanelHeight, { once: true });
    });
    window.addEventListener("resize", refreshPaperPanelHeight, { passive: true });
  }

  function positionTopicDots() {
    var gap = 6;
    trigger.querySelectorAll(".rm-topic .rm-dot").forEach(function (dot) {
      var label = dot.parentNode.querySelector(".rm-label");
      if (!label) return;
      var box;
      try {
        box = label.getBBox();
      } catch (err) {
        return;
      }
      if (!box || !box.width) return;
      dot.setAttribute("cx", box.x - gap - dot.r.baseVal.value);
      dot.setAttribute("cy", box.y + box.height / 2);
    });
  }

  var positionTopicDotsTimer = null;
  function positionTopicDotsDebounced() {
    window.clearTimeout(positionTopicDotsTimer);
    positionTopicDotsTimer = window.setTimeout(positionTopicDots, 120);
  }

  positionTopicDots();
  updateMapPanCursor();
  window.addEventListener("load", function () {
    positionTopicDots();
    updateMapPanCursor();
  });
  window.addEventListener("resize", positionTopicDotsDebounced, { passive: true });
  window.addEventListener("resize", updateMapPanCursor, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      positionTopicDots();
      updateMapPanCursor();
    });
  }
  // The map can live inside a panel that is hidden on load (getBBox fails while
  // hidden), so re-measure once it actually becomes visible.
  if ("IntersectionObserver" in window) {
    var dotObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          positionTopicDots();
          updateMapPanCursor();
        }
      });
    });
    dotObserver.observe(trigger);
  }

  // data-sort-cites is baked in at build time, but the shown counts come live from the
  // citation-badge JSON (scripts/scholar_cite_counts.liquid). Once that arrives, sort by
  // the same numbers people see.
  function applyCiteMap(map) {
    if (!map || !selectedPubs) return;
    var changed = false;
    selectedPubs.querySelectorAll(".row[data-scholar-id]").forEach(function (row) {
      var id = row.getAttribute("data-scholar-id");
      if (!Object.prototype.hasOwnProperty.call(map, id)) return;
      var value = String(parseCount(map[id]));
      if (row.getAttribute("data-sort-cites") === value) return;
      row.setAttribute("data-sort-cites", value);
      changed = true;
    });
    if (!changed) return;
    if (sortSelect && sortSelect.value === "cites") sortSelect.dispatchEvent(new Event("change"));
    else if (!paperFilter && isPaperPanelVisible()) showDefaultPapers();
  }

  window.addEventListener("pubCiteMapReady", function (e) {
    applyCiteMap(e.detail);
  });

  // Pinned teasers load up front instead of lazily; switching them to eager here, before
  // DOMContentLoaded, also keeps nijigen_motion.js from giving them its lazy-image fade.
  pinnedPaperItems().forEach(function (li) {
    li.classList.add("is-pinned");
    li.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.loading = "eager";
    });
  });
  showDefaultPapers();
  if (window.__PUB_CITE_MAP__) applyCiteMap(window.__PUB_CITE_MAP__);
})();
