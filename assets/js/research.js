(function () {
  var trigger = document.getElementById("research-map-trigger");
  if (!trigger) return;

  var mapShell = document.querySelector(".research-map-shell");
  var mapSvg = trigger.querySelector("svg");
  var scrollLeft = mapShell ? mapShell.querySelector(".research-map-scroll-left") : null;
  var scrollRight = mapShell ? mapShell.querySelector(".research-map-scroll-right") : null;
  var mapRail = mapShell ? mapShell.querySelector(".research-map-rail") : null;
  var mapRailThumb = mapRail ? mapRail.querySelector(".research-map-rail-thumb") : null;
  var paperPanel = document.getElementById("research-map-paper-panel");
  var paperClose = paperPanel ? paperPanel.querySelector(".research-map-paper-close") : null;
  var paperEmpty = paperPanel ? paperPanel.querySelector(".research-paper-empty") : null;
  var paperEmptyText = paperEmpty ? paperEmpty.querySelector(".research-paper-empty-text") : null;
  var paperEmptyClear = paperEmpty ? paperEmpty.querySelector(".research-paper-empty-clear") : null;
  var selectedPubs = document.getElementById("selected-publications");
  var bibSearch = document.getElementById("bibsearch");
  var sortSelect = document.getElementById("pub-sort-by");
  var appliedSort = "default"; // the order the list was last given
  var sortMenu = document.getElementById("research-sort-menu");
  var sortOptions = sortMenu ? Array.prototype.slice.call(sortMenu.querySelectorAll("[data-sort-value]")) : [];
  // The strip that closes the map frame (_includes/research_controls.liquid).
  var strip = mapShell ? mapShell.querySelector(".research-map-strip") : null;
  var stripNow = strip ? strip.querySelector(".rm-strip-now") : null;
  var stripName = strip ? strip.querySelector(".rm-strip-name") : null;
  var stripField = strip ? strip.querySelector(".rm-strip-field") : null;
  var stripGrow = strip ? strip.querySelector(".rm-strip-grow") : null;
  var stripCount = strip ? strip.querySelector(".rm-strip-count") : null;
  var stripNum = strip ? strip.querySelector(".rm-strip-num") : null;
  var stripUnit = strip ? strip.querySelector(".rm-strip-unit") : null;
  var stripClear = strip ? strip.querySelector(".rm-strip-clear") : null;
  var stripLive = strip ? strip.querySelector(".rm-strip-live") : null;
  var resetButton = strip ? strip.querySelector(".rm-strip-reset") : null;
  var filterButton = strip ? strip.querySelector(".rm-strip-filter") : null;
  var sortButton = strip ? strip.querySelector(".rm-strip-sort") : null;
  var sortButtonLabel = sortButton ? sortButton.querySelector("span") : null;
  var mapNodes = mapSvg ? Array.prototype.slice.call(mapSvg.children) : [];
  var mapStations = mapNodes.filter(function (node) {
    return node.classList.contains("rm-station");
  });
  var othersTopic = mapSvg ? mapSvg.querySelector(".rm-topic-others") : null;
  var hubRing = mapSvg ? mapSvg.querySelector(".rm-hub") : null;
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

  // What narrows the list right now: { node, label } for a line, { query } for a text filter.
  var paperFilter = null;

  function isPaperShown(li) {
    return !!li && !li.hidden && !li.classList.contains("unloaded");
  }

  function visiblePaperCount() {
    return allPaperItems().filter(isPaperShown).length;
  }

  function nodeLabel(node) {
    return Array.prototype.map
      .call(node.querySelectorAll(".rm-name, .rm-label"), function (el) {
        return el.textContent.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean)
      .join(" ");
  }

  function setPaperFilter(filter) {
    paperFilter = filter;
    renderStrip();
  }

  // Papers that should only surface via the "Others" node, not in the hub's
  // (LMMs/Agents x Video Understanding) list.
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
    clearActiveNodes();
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
    clearActiveNodes();
    showPaperItems(byCitations(items));
    setPaperFilter(null);
    revealPaperPanel(false);
  }

  function slowScrollToPanel() {
    if (!paperPanel) return;
    var startY = window.pageYOffset || document.documentElement.scrollTop || 0;
    // The map frame comes to rest just under the navbar, so that the map (now showing the
    // chosen line), the strip and the first cards share one view. In a window too short for
    // that to leave room for cards, only the strip stays, as the list's heading: its top
    // hairline 8px under the navbar (the map's lowest labels end 10px above that line).
    var navbar = document.getElementById("navbar");
    var navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 60;
    var anchor = paperPanel;
    var gap = 16;
    if (mapShell && strip) {
      var roomForCards = window.innerHeight - navbarBottom - 12 - mapShell.getBoundingClientRect().height;
      anchor = roomForCards >= 280 ? mapShell : strip;
      gap = roomForCards >= 280 ? 12 : 8;
    }
    var targetY = Math.max(anchor.getBoundingClientRect().top + startY - navbarBottom - gap, 0);
    var distance = targetY - startY;
    if (Math.abs(distance) < 8) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, targetY);
      return;
    }

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

  function clearActiveNodes() {
    document.querySelectorAll(".rm-station.active, .rm-topic.active").forEach(function (node) {
      node.classList.remove("active");
    });
  }

  // bibsearch.js marks the papers a text filter leaves out.
  function dropSearchMarks() {
    document.querySelectorAll(".bibliography, .unloaded").forEach(function (element) {
      element.classList.remove("unloaded");
    });
  }

  function showPapersForSearch() {
    if (!paperPanel || !bibSearch) return;
    if (!bibSearch.value.trim()) {
      // Emptied by hand: bibsearch.js only drops its marks after its debounce.
      dropSearchMarks();
      showDefaultPapers();
      return;
    }

    showPaperItems(allPaperItems());
    clearActiveNodes();
    setPaperFilter({ query: bibSearch.value.trim() });
    revealPaperPanel(false);
  }

  // Our own "input" listener stays out of the events clearBibSearch() sends.
  var ignoreSearchInput = false;

  function clearBibSearch() {
    if (!bibSearch) return;
    var hadText = !!bibSearch.value;
    bibSearch.value = "";
    dropSearchMarks();
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // bibsearch.js keeps the matches highlighted until it hears that the field is empty.
    if (hadText) {
      ignoreSearchInput = true;
      bibSearch.dispatchEvent(new Event("input"));
      ignoreSearchInput = false;
    }
  }

  // "Pinned first" is the order the list starts in; what that is depends on what it shows.
  function restoreDefaultOrder() {
    if (paperFilter && paperFilter.query) showPaperItems(allPaperItems());
    else if (paperFilter && paperFilter.node) showPaperItems(paperItemsForNode(paperFilter.node));
    else showPaperItems(byCitations(allPaperItems()));
  }

  // The hidden <select> is what the sorting code listens to (selected_papers.liquid).
  function applySort(value) {
    // Choosing the order the list is already in changes nothing. (Asked again for "Pinned
    // first", the sorting code would answer with the build order, which is not pinned first.)
    if (!sortSelect || value === sortSelect.value) return;
    sortSelect.value = value;
    sortSelect.dispatchEvent(new Event("change"));
    if (value === "default") restoreDefaultOrder();
  }

  function resetResearchFilters() {
    closeSortMenu(false);
    clearBibSearch();
    if (sortSelect && !isDefaultSort()) {
      sortSelect.value = "default";
      sortSelect.dispatchEvent(new Event("change"));
    }
    showDefaultPapers();
    closeFilterField();
  }

  function showPapersForNode(node) {
    if (!paperPanel || !node) return false;
    clearBibSearch();
    closeSortMenu(false);
    var keys = paperKeysForNode(node);
    var items = paperItemsForNode(node);
    if (!items.length) return false;

    showPaperItems(items);
    clearActiveNodes();
    keys.forEach(function (key) {
      document.querySelectorAll('.rm-station[data-paper-key="' + key + '"]').forEach(function (station) {
        station.classList.add("active");
      });
    });
    node.classList.add("active");
    if (sortSelect && !isDefaultSort()) sortSelect.dispatchEvent(new Event("change"));
    setPaperFilter({ node: node, label: nodeLabel(node) });
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
    if (!isPaperPanelVisible() || !isPaperShown(li)) {
      clearBibSearch();
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

  // Scrolls glide, unless the visitor asked for less motion.
  function glideBehavior() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
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
    // 16px below the navbar (the prompt card scrolls away with the page), leaving out the slide
    // of the card's scroll-in reveal (nijigen_motion.js), which may still be running.
    function offset() {
      var navbar = document.getElementById("navbar");
      var navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 60;
      var slide = parseFloat((window.getComputedStyle(li).translate || "").split(" ")[1]) || 0;
      return li.getBoundingClientRect().top - slide - navbarBottom - 16;
    }
    function glide() {
      window.scrollTo({ top: window.scrollY + offset(), behavior: glideBehavior() });
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
      trigger.scrollBy({ left: -Math.round(trigger.clientWidth * 0.72), behavior: glideBehavior() });
    });
  }
  if (scrollRight) {
    scrollRight.addEventListener("click", function (e) {
      e.stopPropagation();
      trigger.scrollBy({ left: Math.round(trigger.clientWidth * 0.72), behavior: glideBehavior() });
    });
  }
  if (paperClose) paperClose.addEventListener("click", hidePaperPanel);
  // ---- The strip ----------------------------------------------------------------------------
  // The bottom edge of the map frame says what the list is showing, takes the text filter (it
  // is typed straight into that readout) and holds Reset / Filter / Sort. It renders from
  // paperFilter, the sort <select>, the text field and the line name under the pointer.
  var fieldOpen = false; // the readout is being typed into
  var filterPending = false; // bibsearch.js narrows the list 300ms after the last keystroke
  var filterPendingTimer = 0;
  var peekNode = null; // a line name under the pointer, previewed in the readout
  var stripFrame = 0;
  var announced = null;

  function currentQuery() {
    return bibSearch ? bibSearch.value.trim() : "";
  }

  function isHubNode(node) {
    return node.getAttribute("data-paper-mode") === "all-cites";
  }

  // "temporal", "reasoning", ...: the line a topic names, read off its dot.
  function trackOfNode(node) {
    var dot = node.querySelector(".rm-dot");
    var match = dot && (dot.getAttribute("class") || "").match(/rm-fill-([a-z]+)/);
    return match ? match[1] : "";
  }

  // How many papers a line would show, before it is chosen.
  function paperCountForNode(node) {
    if (isHubNode(node)) return hubPaperItems().length;
    return paperKeysForNode(node)
      .map(paperItemForKey)
      .filter(function (item, idx, arr) {
        return item && arr.indexOf(item) === idx;
      }).length;
  }

  function paperWord(count) {
    return count === 1 ? " paper" : " papers";
  }

  // Whether a line is drawn out of the hub: its path starts on the hub's centre.
  function startsAtHub(path) {
    var start = /^\s*M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(path.getAttribute("d") || "");
    if (!start || !hubRing) return false;
    return Math.abs(parseFloat(start[1]) - hubRing.cx.baseVal.value) < 1 && Math.abs(parseFloat(start[2]) - hubRing.cy.baseVal.value) < 1;
  }

  // What the list shows stays vivid on the map and the rest recedes (.is-focused in
  // _base.scss): the stations of the matching papers for a text filter; the line, its name,
  // its stations and the hub it starts from for a line; everything but "Others" for the hub.
  function updateMapFocus() {
    if (!mapSvg) return;
    var keep = null;
    if (paperFilter && paperFilter.query) {
      // The list is still catching up with the typing: the map waits with it.
      if (filterPending) return;
      keep = mapStations.filter(function (station) {
        return isPaperShown(paperItemForKey(station.getAttribute("data-paper-key")));
      });
    } else if (paperFilter && paperFilter.node) {
      var node = paperFilter.node;
      var track = trackOfNode(node);
      var linePaths = mapNodes.filter(function (child) {
        return !!track && child.tagName.toLowerCase() === "path" && child.classList.contains("rm-stroke-" + track);
      });
      var fromHub = linePaths.some(startsAtHub);
      keep = mapNodes.filter(function (child) {
        if (isHubNode(node)) return child !== othersTopic;
        if (child === node || linePaths.indexOf(child) !== -1) return true;
        if (child === hubRing) return fromHub;
        return child.classList.contains("rm-station") && child.classList.contains("active");
      });
    }
    mapSvg.classList.toggle("is-focused", !!keep);
    mapNodes.forEach(function (child) {
      child.classList.toggle("is-kept", !!keep && keep.indexOf(child) !== -1);
    });
  }

  // Whether a control holds the focus and shows it: reached with the keyboard, not pressed with
  // the pointer (after a press, the keys go on scrolling the page).
  function showsFocus(el) {
    if (document.activeElement !== el) return false;
    try {
      return el.matches(":focus-visible");
    } catch (err) {
      return true;
    }
  }

  function scheduleStrip() {
    if (stripFrame) return;
    stripFrame = window.requestAnimationFrame(renderStrip);
  }

  function renderStrip() {
    if (stripFrame) {
      window.cancelAnimationFrame(stripFrame);
      stripFrame = 0;
    }
    if (!strip) return;
    var query = currentQuery();
    var topic = paperFilter && paperFilter.node ? paperFilter.node : null;
    var sort = sortSelect ? sortSelect.value : "default";
    // A browser may have put the select back (history Back) without saying so: the list and
    // the map are sorted to match before the strip says so.
    if (sortSelect && sort !== appliedSort) {
      sortSelect.dispatchEvent(new Event("change"));
      return;
    }
    if (!query && document.activeElement !== bibSearch) fieldOpen = false;
    var searching = !!query || fieldOpen;
    // A preview never replaces the statement of what the list is showing.
    var peek = !searching && !topic && peekNode ? peekNode : null;
    var shown = searching ? null : peek || topic;
    var track = shown ? trackOfNode(shown) : "";
    var name = shown ? nodeLabel(shown) : "All selected papers";
    var count = peek ? paperCountForNode(peek) : visiblePaperCount();

    strip.classList.toggle("is-searching", searching);
    strip.classList.toggle("is-peek", !!peek);
    // The glyph says where the papers come from: one line (its dot) or every line (the
    // interchange ring; a text filter searches every line too).
    strip.classList.toggle("is-line", !!track);
    // A real line also sends a short run of itself into the strip ("Others" is only a dot).
    strip.classList.toggle("has-run", !!track && track !== "others");
    strip.classList.toggle("is-dashed", track === "code");
    if (track) strip.style.setProperty("--rm-strip-dot", "var(--rm-" + track + ")");
    if (stripName.textContent !== name) stripName.textContent = name;
    stripNow.title = searching ? "" : "Type to filter";
    stripField.classList.toggle("has-query", !!query);
    // The hidden copy of the text that gives the field its width.
    if (bibSearch) stripGrow.setAttribute("data-value", bibSearch.value || bibSearch.placeholder || "");

    // While the list is still catching up with the typing, the count is left as it is. (In the
    // field it stands before the words, and is there from the start, so it never pushes them.)
    if (!(searching && filterPending)) {
      stripCount.hidden = false;
      stripNum.textContent = String(count);
      stripUnit.textContent = searching || shown ? paperWord(count) : "";
    }

    // The x goes back to all selected papers and leaves the order alone.
    var clearLabel = query ? "Clear the text filter" : "Back to all selected papers";
    var hideClear = !!peek || !(query || (!searching && topic));
    // A control that leaves while it shows the focus hands the focus to its neighbour (and
    // the page stays where it is).
    if (hideClear && showsFocus(stripClear)) filterButton.focus({ preventScroll: true });
    stripClear.hidden = hideClear;
    stripClear.title = clearLabel;
    stripClear.setAttribute("aria-label", clearLabel);

    // Reset is there only while something differs from the start.
    var changed = !!query || !!topic || sort !== "default";
    if (!changed && showsFocus(resetButton)) sortButton.focus({ preventScroll: true });
    resetButton.classList.toggle("is-on", changed);
    resetButton.tabIndex = changed ? 0 : -1;
    resetButton.setAttribute("aria-hidden", changed ? "false" : "true");

    filterButton.classList.toggle("is-on", searching);
    filterButton.setAttribute("aria-pressed", searching ? "true" : "false");

    var sortName = "";
    sortOptions.forEach(function (option) {
      var selected = option.getAttribute("data-sort-value") === sort;
      option.setAttribute("aria-selected", selected ? "true" : "false");
      if (selected && sort !== "default") sortName = option.textContent;
    });
    var sortText = sortName ? "Sort · " + sortName : "Sort";
    sortButton.classList.toggle("is-on", !!sortName);
    if (sortButtonLabel.textContent !== sortText) sortButtonLabel.textContent = sortText;

    updateMapFocus();

    // Nothing matches: one quiet line where the cards would be.
    var noMatch = !!query && !filterPending && !count;
    if (paperEmpty) {
      if (noMatch) paperEmptyText.textContent = "No papers match “" + query + "”.";
      paperEmpty.hidden = !noMatch;
    }

    // One sentence for screen readers when what the list shows has changed (not on the first
    // render; a preview does not change the list).
    var listed = visiblePaperCount();
    var say = topic ? nodeLabel(topic) + ", " + listed + paperWord(listed) : "All selected papers, " + listed;
    if (query) say = filterPending ? announced : "Filter “" + query + "”: " + (listed || "no") + paperWord(listed);
    if (say !== announced) {
      if (announced !== null) stripLive.textContent = say;
      announced = say;
    }
  }

  // While the list is sorted, each station's bracket tag carries the value it is sorted by:
  // "[536 citations]", "[3.3k stars]", "[1st author]". By year the tags already say it (the
  // venue and its year), so they only turn vivid. Stations without a venue line have an empty
  // tag in the map's markup for this.
  var stationTags = mapStations.map(function (station) {
    var tag = station.querySelector(".rm-venue");
    return { station: station, tag: tag, venue: tag ? tag.textContent : "" };
  });

  function ordinal(n) {
    var suffixes = ["th", "st", "nd", "rd"];
    var rest = n % 100;
    return n + (suffixes[(rest - 20) % 10] || suffixes[rest] || suffixes[0]);
  }

  function sortTagText(criterion, li, venue) {
    var row = li ? li.querySelector(".row") : null;
    if (!row) return "";
    if (criterion === "year") {
      var year = row.getAttribute("data-sort-year") || "";
      return venue || (/^\d{4}$/.test(year) ? "['" + year.slice(-2) + "]" : "");
    }
    if (criterion === "cites") {
      var cites = parseCount(row.getAttribute("data-sort-cites"));
      return "[" + cites.toLocaleString("en-US") + (cites === 1 ? " citation]" : " citations]");
    }
    if (criterion === "authorpos") {
      var position = parseInt(row.getAttribute("data-sort-author-pos"), 10);
      return position > 0 && position < 999 ? "[" + ordinal(position) + " author]" : "";
    }
    if (criterion === "stars") {
      // The Code button's count: shields' rounded one ("3.3k") once it has arrived.
      var stars = li.querySelector(".gh-stars");
      var label = stars && !stars.parentElement.hidden ? stars.textContent.trim() : "";
      return /^\d/.test(label) ? "[" + label + (label === "1" ? " star]" : " stars]") : "";
    }
    return "";
  }

  function renderSortTags() {
    var criterion = sortSelect ? sortSelect.value : "default";
    stationTags.forEach(function (entry) {
      if (!entry.tag) return;
      var li = paperItemForKey(entry.station.getAttribute("data-paper-key"));
      var text = criterion === "default" ? "" : sortTagText(criterion, li, entry.venue);
      var shown = text || entry.venue;
      if (entry.tag.textContent !== shown) entry.tag.textContent = shown;
      entry.tag.classList.toggle("is-live", !!text);
    });
  }

  // The text filter: typed straight into the readout.
  function openFilterField(selectAll) {
    if (!strip || !bibSearch) return;
    closeSortMenu(false);
    fieldOpen = true;
    // Shown before it can take the focus.
    strip.classList.add("is-searching");
    bibSearch.focus();
    if (selectAll && bibSearch.value) bibSearch.select();
    renderStrip();
  }

  // returnFocus: left with the keyboard (Escape), the focus goes back to Filter.
  function closeFilterField(returnFocus) {
    fieldOpen = false;
    if (bibSearch && document.activeElement === bibSearch) {
      if (returnFocus && filterButton) filterButton.focus();
      else bibSearch.blur();
    }
    renderStrip();
  }

  // The sort menu is our own listbox. (A native select's menu is drawn by the OS and lands in
  // the wrong place in scaled previews.)
  //
  // Where the open menu goes: it hangs under the frame. The homepage panel clips what hangs
  // out of it, and so does the window: with too little room there (no match, a short list) it
  // opens over the map instead, as far as the navbar. In a window too short for either, it
  // takes the side with more room and scrolls.
  function placeSortMenu(opening) {
    if (!sortMenu || sortMenu.hidden) return;
    var selected = sortMenu.querySelector('[aria-selected="true"]') || sortOptions[0];
    sortMenu.classList.remove("opens-up", "is-capped");
    sortMenu.style.maxHeight = "";
    // Under Sort: while Reset is shown after it, in from the frame's corner by Reset's width.
    sortMenu.style.right = resetButton.classList.contains("is-on") ? resetButton.scrollWidth - 1 + "px" : "";
    var clip = mapShell.closest(".about-inline-panel-inner");
    var navbar = document.getElementById("navbar");
    var navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
    var stripBox = strip.getBoundingClientRect();
    var menuBox = sortMenu.getBoundingClientRect();
    // Opened from the keyboard with the strip scrolled under the navbar, the menu would open
    // under it too: the strip comes out first, to where slowScrollToPanel() leaves it.
    if (opening && menuBox.top < navbarBottom + 8) {
      window.scrollBy(0, stripBox.top - navbarBottom - 8);
      stripBox = strip.getBoundingClientRect();
      menuBox = sortMenu.getBoundingClientRect();
    }
    var hang = menuBox.top - stripBox.bottom;
    var below = Math.min(clip ? clip.getBoundingClientRect().bottom : Infinity, window.innerHeight) - 8 - menuBox.top;
    var above = stripBox.top - hang - navbarBottom - 8;
    var up = menuBox.height > below && above > below;
    var room = Math.max(up ? above : below, 0);
    sortMenu.classList.toggle("opens-up", up);
    if (menuBox.height > room) {
      // (.is-capped makes it a scroller: _base.scss.)
      sortMenu.classList.add("is-capped");
      sortMenu.style.maxHeight = room + "px";
      sortMenu.scrollTop = selected.offsetTop - (room - selected.offsetHeight) / 2;
    }
  }

  function openSortMenu(focusIn) {
    if (!sortMenu || !sortButton) return;
    sortMenu.hidden = false;
    placeSortMenu(true);
    sortButton.setAttribute("aria-expanded", "true");
    if (focusIn) (sortMenu.querySelector('[aria-selected="true"]') || sortOptions[0]).focus();
  }

  // returnFocus: back to Sort; inPlace: without scrolling Sort into view.
  function closeSortMenu(returnFocus, inPlace) {
    if (!sortMenu || !sortButton || sortMenu.hidden) return;
    sortMenu.hidden = true;
    sortButton.setAttribute("aria-expanded", "false");
    if (returnFocus) sortButton.focus({ preventScroll: !!inPlace });
  }

  if (strip) {
    // Filter opens the field; pressed again over an empty field, it closes it. Whether the
    // field was open is read on pointerdown, before the press takes the focus away from it.
    var filterWasOpen = false;
    filterButton.addEventListener("pointerdown", function () {
      filterWasOpen = fieldOpen && document.activeElement === bibSearch;
    });
    filterButton.addEventListener("click", function (e) {
      // (Only a pointer's click, one with a count, follows that pointerdown.)
      if (e.detail > 0 && filterWasOpen && !currentQuery()) closeFilterField();
      else openFilterField(true);
      filterWasOpen = false;
    });

    // A press on the readout's free stretch while the field has the caret keeps it there, at the
    // end of the words: the field would otherwise fold up for the length of the press.
    stripNow.addEventListener("mousedown", function (e) {
      if (document.activeElement !== bibSearch || e.target === bibSearch || e.target.closest(".rm-strip-clear")) return;
      e.preventDefault();
      var end = bibSearch.value.length;
      bibSearch.setSelectionRange(end, end);
    });

    stripNow.addEventListener("click", function (e) {
      if (e.target.closest(".rm-strip-clear") || e.target.closest(".rm-strip-field")) return;
      openFilterField(false);
    });

    stripClear.addEventListener("click", function () {
      if (!currentQuery()) {
        showDefaultPapers();
        return;
      }
      clearBibSearch();
      showDefaultPapers();
      // The caret stays in the field, ready for another word.
      openFilterField(false);
    });

    resetButton.addEventListener("click", resetResearchFilters);
    // Reset opens out of the strip's end and moves Sort: an open menu follows Sort.
    resetButton.addEventListener("transitionend", function (e) {
      if (e.propertyName === "max-width") placeSortMenu(false);
    });

    // A held Enter repeats. The repeats must not go on to press the control the focus has just
    // been handed to (the x hands it to Filter, Reset to Sort, Sort to its menu and back).
    strip.addEventListener("keydown", function (e) {
      if (e.repeat && e.key === "Enter" && e.target.closest("button")) e.preventDefault();
    });

    // Opened with the keyboard, the menu takes the focus; with the pointer, Sort keeps it
    // (Safari does not focus a button on click), so that the arrow keys start from there.
    // (A click made with the keyboard has no count.)
    sortButton.addEventListener("click", function (e) {
      var byPointer = e.detail > 0;
      if (sortMenu.hidden) {
        openSortMenu(!byPointer);
        if (byPointer) sortButton.focus({ preventScroll: true });
      } else {
        closeSortMenu(false);
      }
    });
    sortButton.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown") return;
      e.preventDefault();
      if (sortMenu.hidden) openSortMenu(true);
      else (sortMenu.querySelector('[aria-selected="true"]') || sortOptions[0]).focus();
    });
    sortOptions.forEach(function (option) {
      option.addEventListener("click", function (e) {
        applySort(option.getAttribute("data-sort-value"));
        // Chosen with the pointer, the page stays where it is.
        closeSortMenu(true, e.detail > 0);
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
      } else if (e.key === "Tab") {
        closeSortMenu(false);
      }
    });
    // A press on the menu's own padding leaves the focus where it is.
    sortMenu.addEventListener("mousedown", function (e) {
      if (e.target === sortMenu) e.preventDefault();
    });
    // The press that closes the menu is not a press on the back-to-top button: the button is
    // aside while the menu is open (_base.scss) and comes back under the pointer as it closes.
    var closingPress = false;
    document.addEventListener("pointerdown", function (e) {
      var outside = !sortMenu.hidden && !sortMenu.contains(e.target) && !sortButton.contains(e.target);
      closingPress = outside && !(e.target.closest && e.target.closest("#back-to-top"));
      if (outside) closeSortMenu(false);
    });
    document.addEventListener(
      "click",
      function (e) {
        if (closingPress && e.target.closest && e.target.closest("#back-to-top")) {
          e.preventDefault();
          e.stopPropagation();
        }
        closingPress = false;
      },
      true
    );
    // The focus going anywhere but Sort and the menu closes it too (Shift+Tab off Sort,
    // Cmd/Ctrl+K into site search): left open, it would take the next Escape.
    document.addEventListener("focusin", function (e) {
      if (!sortMenu.hidden && !sortMenu.contains(e.target) && !sortButton.contains(e.target)) closeSortMenu(false);
    });
    // Escape closes the open menu wherever the focus is, and stops there: the homepage's own
    // Escape (about.liquid) would close the whole panel.
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape" || sortMenu.hidden) return;
        // Left open in a panel that has since been closed: not on screen, so Escape is not its.
        if (!sortMenu.getClientRects().length) {
          closeSortMenu(false);
          return;
        }
        e.stopPropagation();
        closeSortMenu(sortMenu.contains(document.activeElement));
      },
      true
    );
  }

  // The menu's first stop is the order the list starts in. Without pinned papers it has no
  // pinned ones to name.
  if (!pinnedKeys.length) {
    sortOptions.forEach(function (option) {
      if (option.getAttribute("data-sort-value") === "default") option.textContent = "Default";
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      appliedSort = sortSelect.value;
      renderSortTags();
      renderStrip();
    });
    // The star counts arrive from shields.io (selected_papers.liquid).
    window.addEventListener("pubStarMapReady", renderSortTags);
    // Coming back through the history, a browser may set the select to the order it had,
    // without saying so: the list and the map are then sorted to match.
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted && !isDefaultSort()) sortSelect.dispatchEvent(new Event("change"));
    });
  }

  if (paperEmptyClear) {
    paperEmptyClear.addEventListener("click", function () {
      clearBibSearch();
      showDefaultPapers();
      openFilterField(false);
    });
  }

  // A line name under the pointer (or the keyboard focus) previews in the readout.
  if (mapSvg && strip) {
    // After a short dwell, so that crossing the map with the pointer does not flicker it.
    var peekTimer = 0;
    var setPeek = function (node) {
      window.clearTimeout(peekTimer);
      if (node === peekNode) return;
      if (!node) {
        peekNode = null;
        scheduleStrip();
        return;
      }
      peekTimer = window.setTimeout(function () {
        peekNode = node;
        scheduleStrip();
      }, 120);
    };
    // The pointer's name and the keyboard's are kept apart: pressing a name focuses it, which
    // must not drop the pointer's preview for the length of the press.
    var hoverNode = null;
    var focusNode = null;
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      mapSvg.addEventListener("mouseover", function (e) {
        hoverNode = e.target.closest ? e.target.closest(".rm-topic") : null;
        setPeek(hoverNode || focusNode);
      });
      mapSvg.addEventListener("mouseleave", function () {
        hoverNode = null;
        setPeek(focusNode);
      });
    }
    // On the map's frame, not on the <svg>: Chrome makes an SVG element that has focus listeners
    // focusable itself, and a press on the map's ground would then focus the whole map and draw
    // the browser's ring round it (in the system's accent colour).
    trigger.addEventListener("focusin", function (e) {
      var node = e.target.closest ? e.target.closest(".rm-topic") : null;
      var byKeyboard = false;
      try {
        byKeyboard = !!node && node.matches(":focus-visible");
      } catch (err) {}
      focusNode = byKeyboard ? node : null;
      setPeek(hoverNode || focusNode);
    });
    trigger.addEventListener("focusout", function () {
      focusNode = null;
      setPeek(hoverNode);
    });
  }

  // bibsearch.js hides non-matching papers after its own debounce, and other code shows, hides
  // and marks cards too, so the strip follows the list rather than only our own updates.
  if (selectedPubs && strip && "MutationObserver" in window) {
    new MutationObserver(scheduleStrip).observe(selectedPubs, { subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  }

  if (bibSearch) {
    bibSearch.addEventListener("input", function () {
      // The count and the map wait until bibsearch.js has caught up (it says so below); should
      // it never answer, they come back on their own.
      filterPending = true;
      window.clearTimeout(filterPendingTimer);
      filterPendingTimer = window.setTimeout(function () {
        filterPending = false;
        renderStrip();
      }, 700);
      if (ignoreSearchInput) return;
      showPapersForSearch();
    });
    window.addEventListener("bibsearch:filtered", function () {
      window.clearTimeout(filterPendingTimer);
      filterPending = false;
      // revealPaperPanel() holds the panel at the height the list had while typing; the list
      // has just changed, and must not stay clipped to that.
      window.clearTimeout(paperPanelHeightTimer);
      releasePaperPanelHeight();
      renderStrip();
      // Sort may have been opened while the filter was still waiting: the list has changed
      // under the open menu, which is placed again once the cards are laid out.
      window.requestAnimationFrame(function () {
        placeSortMenu(false);
      });
    });
    bibSearch.addEventListener("focus", function () {
      fieldOpen = true;
      scheduleStrip();
    });
    bibSearch.addEventListener("blur", function () {
      // After the click that took the focus has run (it may empty the field itself).
      window.setTimeout(renderStrip, 0);
    });
    bibSearch.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      // Escape would close the whole homepage panel: here it first empties the field, then
      // leaves it.
      e.stopPropagation();
      if (bibSearch.value) {
        clearBibSearch();
        showDefaultPapers();
      } else {
        closeFilterField(true);
      }
    });
    window.addEventListener("hashchange", function () {
      window.setTimeout(showPapersForSearch, 0);
    });
    // bibsearch.js has put a filter carried by the address (#text) into the field by now.
    // Without one the list is left as it is: a line may have been chosen already.
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(function () {
        if (currentQuery()) showPapersForSearch();
      }, 0);
    });
  }
  if (paperPanel) {
    paperPanel.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", refreshPaperPanelHeight, { once: true });
    });
    // The list re-flows to another height: a height still held for the opening would clip it.
    window.addEventListener("resize", releasePaperPanelHeight, { passive: true });
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
    renderSortTags();
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
