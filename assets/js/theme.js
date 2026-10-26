// Has to be in the head tag, otherwise a flicker effect will occur.

// Toggle between light and dark. With no saved choice, the site follows the system.
let toggleThemeSetting = () => {
  if (determineComputedTheme() == "dark") {
    setThemeSetting("light");
  } else {
    setThemeSetting("dark");
  }
};

// Change the theme setting and apply the theme.
let setThemeSetting = (themeSetting) => {
  if (themeSetting == "dark" || themeSetting == "light") {
    localStorage.setItem("theme", themeSetting);
  } else {
    localStorage.removeItem("theme");
  }

  document.documentElement.setAttribute("data-theme-setting", determineThemeSetting());

  applyTheme();
};

// Apply the computed dark or light theme to the website.
let applyTheme = () => {
  let theme = determineComputedTheme();

  transTheme();
  setHighlight(theme);
  setGiscusTheme(theme);
  setSearchTheme(theme);

  // if mermaid is not defined, do nothing
  if (typeof mermaid !== "undefined") {
    setMermaidTheme(theme);
  }

  // if diff2html is not defined, do nothing
  if (typeof Diff2HtmlUI !== "undefined") {
    setDiff2htmlTheme(theme);
  }

  // if echarts is not defined, do nothing
  if (typeof echarts !== "undefined") {
    setEchartsTheme(theme);
  }

  // if vegaEmbed is not defined, do nothing
  if (typeof vegaEmbed !== "undefined") {
    setVegaLiteTheme(theme);
  }

  document.documentElement.setAttribute("data-theme", theme);

  // Safari iOS: reduce pale strip above page (rubber band / chrome) by matching UI tint to gradient top.
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    let top = getComputedStyle(document.documentElement).getPropertyValue("--global-bg-gradient-top").trim();
    if (top) {
      themeColorMeta.setAttribute("content", top);
    }
  }

  // Add class to tables.
  let tables = document.getElementsByTagName("table");
  for (let i = 0; i < tables.length; i++) {
    if (theme == "dark") {
      tables[i].classList.add("table-dark");
    } else {
      tables[i].classList.remove("table-dark");
    }
  }

  // Set jupyter notebooks themes.
  let jupyterNotebooks = document.getElementsByClassName("jupyter-notebook-iframe-container");
  for (let i = 0; i < jupyterNotebooks.length; i++) {
    let bodyElement = jupyterNotebooks[i].getElementsByTagName("iframe")[0].contentWindow.document.body;
    if (theme == "dark") {
      bodyElement.setAttribute("data-jp-theme-light", "false");
      bodyElement.setAttribute("data-jp-theme-name", "JupyterLab Dark");
    } else {
      bodyElement.setAttribute("data-jp-theme-light", "true");
      bodyElement.setAttribute("data-jp-theme-name", "JupyterLab Light");
    }
  }

  // Updates the background of medium-zoom overlay.
  if (typeof medium_zoom !== "undefined") {
    medium_zoom.update({
      background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee", // + 'ee' for trasparency.
    });
  }

  // Dispatch theme change event
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
};

let setHighlight = (theme) => {
  if (theme == "dark") {
    document.getElementById("highlight_theme_light").media = "none";
    document.getElementById("highlight_theme_dark").media = "";
  } else {
    document.getElementById("highlight_theme_dark").media = "none";
    document.getElementById("highlight_theme_light").media = "";
  }
};

let setGiscusTheme = (theme) => {
  function sendMessage(message) {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return;
    iframe.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
  }

  sendMessage({
    setConfig: {
      theme: theme,
    },
  });
};

let addMermaidZoom = (records, observer) => {
  var svgs = d3.selectAll(".mermaid svg");
  svgs.each(function () {
    var svg = d3.select(this);
    svg.html("<g>" + svg.html() + "</g>");
    var inner = svg.select("g");
    var zoom = d3.zoom().on("zoom", function (event) {
      inner.attr("transform", event.transform);
    });
    svg.call(zoom);
  });
  observer.disconnect();
};

let setMermaidTheme = (theme) => {
  if (theme == "light") {
    // light theme name in mermaid is 'default'
    // https://mermaid.js.org/config/theming.html#available-themes
    theme = "default";
  }

  /* Re-render the SVG, based on https://github.com/cotes2020/jekyll-theme-chirpy/blob/master/_includes/mermaid.html */
  document.querySelectorAll(".mermaid").forEach((elem) => {
    // Get the code block content from previous element, since it is the mermaid code itself as defined in Markdown, but it is hidden
    let svgCode = elem.previousSibling.childNodes[0].innerHTML;
    elem.removeAttribute("data-processed");
    elem.innerHTML = svgCode;
  });

  mermaid.initialize({ theme: theme });
  window.mermaid.init(undefined, document.querySelectorAll(".mermaid"));

  const observable = document.querySelector(".mermaid svg");
  if (observable !== null) {
    var observer = new MutationObserver(addMermaidZoom);
    const observerOptions = { childList: true };
    observer.observe(observable, observerOptions);
  }
};

let setDiff2htmlTheme = (theme) => {
  document.querySelectorAll(".diff2html").forEach((elem) => {
    // Get the code block content from previous element, since it is the diff code itself as defined in Markdown, but it is hidden
    let textData = elem.previousSibling.childNodes[0].innerHTML;
    elem.innerHTML = "";
    const configuration = { colorScheme: theme, drawFileList: true, highlight: true, matching: "lines" };
    const diff2htmlUi = new Diff2HtmlUI(elem, textData, configuration);
    diff2htmlUi.draw();
  });
};

let setEchartsTheme = (theme) => {
  document.querySelectorAll(".echarts").forEach((elem) => {
    // Get the code block content from previous element, since it is the echarts code itself as defined in Markdown, but it is hidden
    let jsonData = elem.previousSibling.childNodes[0].innerHTML;
    echarts.dispose(elem);

    if (theme === "dark") {
      var chart = echarts.init(elem, "dark-fresh-cut");
    } else {
      var chart = echarts.init(elem);
    }

    chart.setOption(JSON.parse(jsonData));
  });
};

let setVegaLiteTheme = (theme) => {
  document.querySelectorAll(".vega-lite").forEach((elem) => {
    // Get the code block content from previous element, since it is the vega lite code itself as defined in Markdown, but it is hidden
    let jsonData = elem.previousSibling.childNodes[0].innerHTML;
    elem.innerHTML = "";
    if (theme === "dark") {
      vegaEmbed(elem, JSON.parse(jsonData), { theme: "dark" });
    } else {
      vegaEmbed(elem, JSON.parse(jsonData));
    }
  });
};

let setSearchTheme = (theme) => {
  const ninjaKeys = document.querySelector("ninja-keys");
  if (!ninjaKeys) return;

  if (theme === "dark") {
    ninjaKeys.classList.add("dark");
  } else {
    ninjaKeys.classList.remove("dark");
  }
};

let transTheme = () => {
  document.documentElement.classList.add("transition");
  window.setTimeout(() => {
    document.documentElement.classList.remove("transition");
  }, 500);
};

let getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

// Determine the expected state of the theme toggle, which can be "dark", "light", or "system". Default is "system".
let determineThemeSetting = () => {
  let themeSetting = localStorage.getItem("theme");
  if (themeSetting != "dark" && themeSetting != "light") {
    themeSetting = "system";
  }
  return themeSetting;
};

// Determine the computed theme, which can be "dark" or "light".
let determineComputedTheme = () => {
  let themeSetting = determineThemeSetting();
  if (themeSetting == "system") {
    return getSystemTheme();
  }
  return themeSetting;
};

let initTheme = () => {
  document.documentElement.setAttribute("data-theme-setting", determineThemeSetting());
  applyTheme();

  // Navbar and profile drawer each have a theme toggle.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".light-toggle").forEach(function (mode_toggle) {
      mode_toggle.addEventListener("click", function () {
        // NEW K5: circular reveal via the View Transitions API (falls back to the
        // plain toggle on unsupported browsers or reduced-motion preference).
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || reduceMotion) {
          toggleThemeSetting();
          return;
        }
        const rect = mode_toggle.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const endRadius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
        // NEW N2: small star burst at the toggle (handled by nijigen_sparkle.js).
        document.dispatchEvent(new CustomEvent("niji:burst", { detail: { x: cx, y: cy } }));
        // Mark theme-toggle transitions so CSS can distinguish them from
        // cross-document (page navigation) view transitions.
        document.documentElement.classList.add("niji-theme-vt");
        const transition = document.startViewTransition(() => {
          toggleThemeSetting();
        });
        transition.finished.finally(() => {
          document.documentElement.classList.remove("niji-theme-vt");
        });
        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: ["circle(0px at " + cx + "px " + cy + "px)", "circle(" + endRadius + "px at " + cx + "px " + cy + "px)"],
            },
            { duration: 480, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
          );
        });
      });
    });
  });

  if (window.matchMedia) {
    let systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    let handleSystemThemeChange = function () {
      if (determineThemeSetting() == "system") {
        document.documentElement.setAttribute("data-theme-setting", "system");
        applyTheme();
      }
    };

    if (systemThemeQuery.addEventListener) {
      systemThemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (systemThemeQuery.addListener) {
      systemThemeQuery.addListener(handleSystemThemeChange);
    }
  }
};
