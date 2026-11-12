// 二次元 motion layer: L1 连击冲击波 / L2 卡片 3D 倾斜 / L4 磁性快捷按钮
// Roll back: remove this file and its <script> line in _layouts/default.liquid.
// 各功能独立成段，可单独删除。
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---- NEW L1: 吉祥物连击冲击波 --------------------------------------------------
  // 1.4 秒内连点头像 5 次，触发粉蓝双环冲击波（之后计数清零，可再次触发）。
  var comboCount = 0;
  var comboLastAt = 0;

  document.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    var mascot = e.target.closest && e.target.closest(".post-title-avatar-button, .navbar-menu-avatar");
    if (!mascot) return;
    var now = Date.now();
    comboCount = now - comboLastAt < 1400 ? comboCount + 1 : 1;
    comboLastAt = now;
    if (comboCount >= 5) {
      comboCount = 0;
      shockwave(e.clientX, e.clientY, false);
      setTimeout(function () {
        shockwave(e.clientX, e.clientY, true);
      }, 120);
    }
  });

  function shockwave(x, y, blue) {
    var el = document.createElement("span");
    if (!el.animate) return;
    el.className = "niji-shockwave" + (blue ? " is-blue" : "");
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    var animation = el.animate(
      [
        { opacity: 1, transform: "scale(0.4)" },
        { opacity: 0, transform: "scale(14)" },
      ],
      { duration: 620, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
    animation.onfinish = function () {
      el.remove();
    };
    setTimeout(function () {
      el.remove();
    }, 1500);
  }

  // ---- NEW M1: 滚动渐显 -------------------------------------------------------------
  // 论文条目、博客列表项进入视口时淡入上浮（一次性，不重复播放）。
  // 画廊瀑布流的 .ig-post 用 transform 定位，跳过以免冲突。
  // 置顶论文（research.js 标记 .is-pinned）直接显示，不等滚动。

  document.addEventListener("DOMContentLoaded", function () {
    if (!("IntersectionObserver" in window)) return;
    var targets = document.querySelectorAll(".publications ol.bibliography > li:not(.is-pinned), .post-list li");
    if (!targets.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.transitionDelay = Math.round(Math.random() * 110) + "ms";
          el.classList.add("niji-revealed");
          io.unobserve(el);
        });
      },
      // 卡片的位置一进入视口就显现：目之所及不留空白。未显现时它下移 16px（.niji-to-reveal），
      // 所以视口下沿多算 24px，抵掉这段下移。
      { rootMargin: "0px 0px 24px 0px" }
    );
    targets.forEach(function (el) {
      el.classList.add("niji-to-reveal");
      io.observe(el);
    });
  });

  // ---- NEW P1: 复制彩蛋 --------------------------------------------------------------
  // 复制页面文字时，在选区右上角迸出一小簇星星（通过 niji:burst 交给 sparkle 处理）。

  document.addEventListener("copy", function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    var rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    document.dispatchEvent(new CustomEvent("niji:burst", { detail: { x: rect.right, y: rect.top } }));
  });

  // ---- NEW P2: 图片加载淡入 ----------------------------------------------------------
  // 懒加载图片就位时柔和淡入，不再突兀地"啪"一下出现。只动透明度，不影响布局。

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete) return;
      img.classList.add("niji-img-loading");
      img.addEventListener(
        "load",
        function () {
          img.classList.add("niji-img-loaded");
          img.classList.remove("niji-img-loading");
        },
        { once: true }
      );
      img.addEventListener(
        "error",
        function () {
          img.classList.remove("niji-img-loading");
        },
        { once: true }
      );
    });
  });

  // ---- NEW P3: 标签页标题彩蛋 --------------------------------------------------------
  // 切走标签页时标题变成小表情挽留，切回来立刻恢复原标题。

  var nijiAwayTitle = "Yolo's here (´･ω･`)";
  var nijiOriginalTitle = null;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      nijiOriginalTitle = document.title;
      document.title = nijiAwayTitle;
    } else if (nijiOriginalTitle !== null) {
      document.title = nijiOriginalTitle;
      nijiOriginalTitle = null;
    }
  });

  // ---- NEW L4: 磁性快捷按钮 -------------------------------------------------------
  // 主页 Research / Yo'Log / Gallery 按钮被鼠标"吸"向指针（最多 4px）。
  var MAGNET = 4;

  document.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var chip = e.target.closest && e.target.closest(".about-quick-links a");
      if (!chip) return;
      var rect = chip.getBoundingClientRect();
      var dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * MAGNET;
      var dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * MAGNET;
      chip.style.transform = "translate(" + dx.toFixed(1) + "px, " + (dy - 2).toFixed(1) + "px) scale(1.05)";
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerout",
    function (e) {
      var chip = e.target.closest && e.target.closest(".about-quick-links a");
      if (!chip) return;
      if (e.relatedTarget && chip.contains(e.relatedTarget)) return;
      chip.style.transform = "";
    },
    { passive: true }
  );
})();
