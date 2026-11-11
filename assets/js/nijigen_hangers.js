// 吊牌挂件 — two hangers hang the homepage card from the navbar, so the card reads as a sign:
// a cord with a binder clip in Academic mode, a sheer ribbon with a bow in Creative mode (the
// look is all CSS, keyed on .is-creative-mode). The hangers reach from just under the navbar
// down to the card's top edge. Their length follows the card frame by frame: when a panel opens
// and the card glides up they reel in under the navbar, and when it glides back down they pay
// out again. The length is handed to CSS as plain px values (no calc(a + b) in the CSS: the
// production minifier strips the spaces and breaks it). The card itself never swings.
// Styles: "吊牌挂件" in _sass/_nijigen.scss. Roll back: delete this file, that block, and the
// <script> line in _layouts/about.liquid.
(function () {
  var card = document.querySelector(".about-jp .about-prompt");
  var root = document.querySelector(".about-jp");
  var navbar = document.getElementById("navbar");
  if (!card || !root || !navbar) return;

  // How far the hanger tucks under the navbar, so no gap shows at its top.
  var TUCK = 6;
  // How far the hanger (and its clip or bow) reaches down into the card's top edge
  // (margin-bottom: -5px in CSS).
  var END_INSET = 5;
  // Below this gap there is no room for the hanger and its clip or bow: fade it out. Docked
  // cards (panels open) sit 24px under the navbar, so they keep a short hanger.
  var MIN_GAP = 20;

  ["left", "right"].forEach(function (side) {
    var hanger = document.createElement("span");
    hanger.className = "about-hanger about-hanger-" + side;
    hanger.setAttribute("aria-hidden", "true");
    hanger.innerHTML = '<span class="about-hanger-strand"></span><span class="about-hanger-end"></span>';
    card.appendChild(hanger);
  });

  // Where the card's top edge is drawn, in viewport coordinates: its layout position (offsetTop,
  // which ignores transforms) plus the translate the panel glide in about.liquid puts on it.
  function cardTop() {
    var top = 0;
    for (var el = card; el; el = el.offsetParent) top += el.offsetTop;
    var transform = window.getComputedStyle(card).transform;
    if (transform && transform !== "none") {
      var m = transform.match(/matrix(3d)?\(([^)]+)\)/);
      if (m) {
        var v = m[2].split(",");
        top += parseFloat(m[1] ? v[13] : v[5]) || 0;
      }
    }
    return top - window.scrollY;
  }

  function measure() {
    var gap = Math.round(cardTop() - navbar.getBoundingClientRect().bottom);
    // Keep the length current even while hidden, so a hanger that fades in starts at the right size.
    card.style.setProperty("--about-hanger-length", Math.max(gap, 0) + END_INSET + TUCK + "px");
    card.classList.toggle("has-hangers", gap >= MIN_GAP);
  }

  // While the card moves (a panel opening or closing, the header easing in after load, the
  // card resizing for the other mode), measure every frame so the hangers stay attached.
  var followUntil = 0;
  var following = false;
  function followFor(ms) {
    followUntil = Math.max(followUntil, Date.now() + ms);
    if (following) return;
    following = true;
    window.requestAnimationFrame(function step() {
      measure();
      if (Date.now() < followUntil) window.requestAnimationFrame(step);
      else following = false;
    });
  }

  var frame = null;
  function scheduleMeasure() {
    if (frame === null)
      frame = window.requestAnimationFrame(function () {
        frame = null;
        measure();
      });
  }

  window.addEventListener("resize", scheduleMeasure, { passive: true });
  window.addEventListener("scroll", scheduleMeasure, { passive: true });
  window.addEventListener("load", function () {
    followFor(900);
  });
  root.addEventListener("transitionend", scheduleMeasure);
  if ("ResizeObserver" in window) new ResizeObserver(scheduleMeasure).observe(card);
  // Opening or closing a panel toggles classes on the page root, then the mascot ducks
  // (~0.35s) and the card glides (~0.5s): follow for long enough to cover both.
  new MutationObserver(function () {
    followFor(1400);
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);
  // about.liquid's card glide sets a new translate in its own animation frame; it calls this
  // right after, so the hangers measure that frame's position instead of the previous one.
  window.aboutHangersSync = measure;
  measure();
  followFor(900);
})();
