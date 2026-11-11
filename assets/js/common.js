$(document).ready(function () {
  // add toggle functionality to abstract, award and bibtex buttons
  $("a.abstract").click(function () {
    $(this).parent().parent().find(".abstract.hidden").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.award").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  // Cite: copy the BibTeX to the clipboard with a small toast,
  // instead of expanding the raw bibtex block (falls back to the
  // old toggle if the Clipboard API is unavailable or fails).
  $("a.bibtex").click(function () {
    var $entry = $(this).parent().parent();
    var btn = this;

    function fallbackToggle() {
      $entry.find(".abstract.hidden.open").toggleClass("open");
      $entry.find(".award.hidden.open").toggleClass("open");
      $entry.find(".bibtex.hidden").toggleClass("open");
    }

    function showCiteToast(message) {
      var rect = btn.getBoundingClientRect();
      var toast = document.createElement("span");
      toast.className = "niji-cite-toast";
      toast.textContent = message;
      toast.style.left = rect.left + rect.width / 2 + "px";
      toast.style.top = rect.top - 34 + "px";
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.remove();
      }, 1500);
      document.dispatchEvent(new CustomEvent("niji:burst", { detail: { x: rect.left + rect.width / 2, y: rect.top } }));
    }

    // Legacy copy path for non-secure contexts (e.g. http://0.0.0.0:8080),
    // where navigator.clipboard is unavailable.
    function legacyCopy(value) {
      var textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      textarea.remove();
      return ok;
    }

    var text = $entry.find(".bibtex.hidden").text().trim();
    if (!text) {
      fallbackToggle();
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showCiteToast("BibTeX copied ✧");
        },
        function () {
          if (legacyCopy(text)) {
            showCiteToast("BibTeX copied ✧");
          } else {
            fallbackToggle();
          }
        }
      );
    } else if (legacyCopy(text)) {
      showCiteToast("BibTeX copied ✧");
    } else {
      fallbackToggle();
    }
  });

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });
});
