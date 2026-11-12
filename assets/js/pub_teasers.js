// Paper cards with several teasers (_layouts/bib.liquid, preview={a.png, b.png}): a track that
// snaps to one figure at a time, as the gallery's posts do. Dots under the figures choose one;
// on screens with a pointer, arrows show on hover. A swipe or a trackpad's sideways scroll moves
// the track itself.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setUp(carousel) {
    var track = carousel.querySelector(".pub-teasers-track");
    if (!track) return;
    var slides = track.children;
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".pub-teasers-dot"));
    var prev = carousel.querySelector(".pub-teasers-prev");
    var next = carousel.querySelector(".pub-teasers-next");
    // The figure the track rests on. The masonry re-lays the cards out (a filter, a sort, a
    // resize), and a hidden card has no width at all: the track goes back to this one after.
    var chosen = 0;
    var settleTimer = 0;

    // The first figure sets the carousel's height, at the card's width; the others are fitted
    // inside it, centred (_base.scss), so that the card never grows round it with white. Their
    // widths are worked out here from their own proportions: a responsive image's size as the
    // browser has it can be off (a "1400w" file made from a smaller one is smaller than that).
    var figures = Array.prototype.map.call(slides, function (slide) {
      return slide.querySelector("img");
    });
    var lead = figures[0];
    function fit() {
      if (!lead || !lead.naturalWidth || !track.clientWidth) return;
      var width = track.clientWidth;
      var height = (width * lead.naturalHeight) / lead.naturalWidth;
      carousel.style.setProperty("--pub-teasers-height", height.toFixed(1) + "px");
      carousel.classList.add("is-fitted");
      figures.forEach(function (img, i) {
        if (!i || !img || !img.naturalWidth) return;
        img.style.width = Math.min(width, (height * img.naturalWidth) / img.naturalHeight).toFixed(1) + "px";
      });
    }
    figures.forEach(function (img) {
      if (img && !img.complete) img.addEventListener("load", fit);
    });
    fit();

    function current() {
      if (!track.clientWidth) return chosen;
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    }

    function render(index) {
      dots.forEach(function (dot, i) {
        var on = i === index;
        dot.classList.toggle("is-active", on);
        if (on) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (prev) prev.classList.toggle("is-off", index <= 0);
      if (next) next.classList.toggle("is-off", index >= slides.length - 1);
    }

    function go(index) {
      index = Math.max(0, Math.min(slides.length - 1, index));
      chosen = index;
      render(index);
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    }

    track.addEventListener(
      "scroll",
      function () {
        if (!track.clientWidth) return;
        render(current());
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(function () {
          chosen = current();
        }, 140);
      },
      { passive: true }
    );

    if (prev)
      prev.addEventListener("click", function () {
        go(current() - 1);
      });
    if (next)
      next.addEventListener("click", function () {
        go(current() + 1);
      });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        go(i);
      });
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        if (!track.clientWidth) return;
        fit();
        track.scrollLeft = chosen * track.clientWidth;
        render(chosen);
      }).observe(track);
    }
    render(0);
  }

  function setUpAll() {
    Array.prototype.forEach.call(document.querySelectorAll(".pub-teasers"), setUp);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setUpAll);
  else setUpAll();
})();
