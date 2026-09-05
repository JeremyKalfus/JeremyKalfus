const VIEW_NAMES = ["about", "portfolio"];

function isHTMLElement(node) {
  return node instanceof HTMLElement;
}

function isToggleCheckbox(node) {
  return node instanceof HTMLInputElement && node.type === "checkbox";
}

function readViewName(value) {
  return VIEW_NAMES.includes(value) ? value : null;
}

function getThemeState(windowObject = window) {
  const themeState = windowObject.homepageTheme;

  if (
    !themeState ||
    typeof themeState.applyTheme !== "function" ||
    typeof themeState.persistTheme !== "function" ||
    typeof themeState.resolveInitialTheme !== "function"
  ) {
    throw new Error("theme-state.js must load before homepage-ui.js.");
  }

  return themeState;
}

function getMotionState(windowObject = window) {
  const motionState = windowObject.homepageMotion;

  if (
    !motionState ||
    typeof motionState.applyMotion !== "function" ||
    typeof motionState.persistMotion !== "function" ||
    typeof motionState.resolveInitialMotion !== "function"
  ) {
    throw new Error("motion-state.js must load before homepage-ui.js.");
  }

  return motionState;
}

function getDyslexiaState(windowObject = window) {
  const dyslexiaState = windowObject.homepageDyslexia;

  if (
    !dyslexiaState ||
    typeof dyslexiaState.applyDyslexia !== "function" ||
    typeof dyslexiaState.persistDyslexia !== "function" ||
    typeof dyslexiaState.resolveInitialDyslexia !== "function"
  ) {
    throw new Error("dyslexia-state.js must load before homepage-ui.js.");
  }

  return dyslexiaState;
}

function restartPanelEntrance(panel) {
  panel.classList.remove("is-entering");
  void panel.offsetWidth;
  panel.classList.add("is-entering");
}

function refreshActivePanelMotion(documentObject = document) {
  const activePanel = documentObject.querySelector("[data-view-panel].is-active");

  if (isHTMLElement(activePanel) && !activePanel.hidden) {
    restartPanelEntrance(activePanel);
  }
}

function clearPanelMotion(documentObject = document) {
  documentObject.querySelectorAll("[data-view-panel].is-entering").forEach((panel) => {
    if (isHTMLElement(panel)) {
      panel.classList.remove("is-entering");
    }
  });
}

function setActiveView(viewName, viewTabs, panelMap, root = document.documentElement) {
  viewTabs.forEach((tab) => {
    const isActive = readViewName(tab.dataset.viewTarget) === viewName;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  const animationsEnabled = root.classList.contains("animations-enabled");

  panelMap.forEach((panel, panelName) => {
    const isActive = panelName === viewName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);

    if (!animationsEnabled || !isActive) {
      panel.classList.remove("is-entering");
      return;
    }

    restartPanelEntrance(panel);
  });
}

function initThemeControls(themeState, documentObject = document) {
  const toggle = documentObject.querySelector(".theme-toggle-checkbox");
  const label = documentObject.querySelector(".theme-label");

  if (!isToggleCheckbox(toggle) || !isHTMLElement(label)) {
    return;
  }

  const syncThemeControls = (theme, persist) => {
    const appliedTheme = themeState.applyTheme(theme);

    if (persist) {
      themeState.persistTheme(appliedTheme);
    }

    toggle.checked = appliedTheme === "dark";
    label.textContent = appliedTheme === "dark" ? "Dark" : "Light";
  };

  syncThemeControls(themeState.resolveInitialTheme(documentObject.documentElement), false);

  toggle.addEventListener("change", () => {
    syncThemeControls(toggle.checked ? "dark" : "light", true);
  });
}

function initMotionControls(motionState, documentObject = document) {
  const toggle = documentObject.querySelector(".animations-toggle-checkbox");
  const label = documentObject.querySelector(".animations-label");

  if (!isToggleCheckbox(toggle) || !isHTMLElement(label)) {
    return;
  }

  const syncMotionControls = (motion, persist) => {
    const appliedMotion = motion === "on" ? "on" : "off";

    if (appliedMotion === "on") {
      motionState.applyMotion(appliedMotion, documentObject.documentElement);
      toggle.checked = true;
      label.textContent = "On";
      refreshActivePanelMotion(documentObject);
    } else {
      toggle.checked = false;
      label.textContent = "Off";
      motionState.applyMotion(appliedMotion, documentObject.documentElement);
      clearPanelMotion(documentObject);
    }

    if (persist) {
      motionState.persistMotion(appliedMotion);
    }
  };

  syncMotionControls(motionState.resolveInitialMotion(documentObject.documentElement), false);

  toggle.addEventListener("change", () => {
    syncMotionControls(toggle.checked ? "on" : "off", true);
  });
}

function initDyslexiaControls(dyslexiaState, documentObject = document) {
  const toggle = documentObject.querySelector(".dyslexia-toggle-checkbox");
  const label = documentObject.querySelector(".dyslexia-label");

  if (!isToggleCheckbox(toggle) || !isHTMLElement(label)) {
    return;
  }

  const syncDyslexiaControls = (dyslexia, persist) => {
    const appliedDyslexia = dyslexia === "on" ? "on" : "off";

    dyslexiaState.applyDyslexia(appliedDyslexia, documentObject.documentElement);
    toggle.checked = appliedDyslexia === "on";
    label.textContent = appliedDyslexia === "on" ? "On" : "Off";

    if (persist) {
      dyslexiaState.persistDyslexia(appliedDyslexia);
    }
  };

  syncDyslexiaControls(dyslexiaState.resolveInitialDyslexia(documentObject.documentElement), false);

  toggle.addEventListener("change", () => {
    syncDyslexiaControls(toggle.checked ? "on" : "off", true);
  });
}

/* Contact addresses are stored base64-reversed so they are not present as
   literal text in the HTML. This defeats regex-based address harvesters; it is
   not a secret, and anything that executes the page can still read them. */
function decodeContactValue(encoded) {
  return atob(encoded).split("").reverse().join("");
}

function initContactLinks(documentObject = document) {
  const links = documentObject.querySelectorAll(".contact-link[data-scheme][data-value]");

  links.forEach((link) => {
    if (!isHTMLElement(link)) {
      return;
    }

    const { scheme, value } = link.dataset;

    if (!scheme || !value) {
      return;
    }

    try {
      link.setAttribute("href", `${scheme}:${decodeContactValue(value)}`);
    } catch (error) {
      link.removeAttribute("href");
    }
  });
}

function initInfoButtons(documentObject = document) {
  const pairs = [];

  documentObject.querySelectorAll(".info-button[aria-describedby]").forEach((button) => {
    const tip = documentObject.getElementById(button.getAttribute("aria-describedby"));

    if (!(button instanceof HTMLButtonElement) || !isHTMLElement(tip)) {
      return;
    }

    pairs.push({ button, tip });
  });

  if (!pairs.length) {
    return;
  }

  /* Hover and focus are handled in CSS. This only covers touch, where there is
     no hover, and gives the tip a way out once it is pinned open. */
  const closeAll = () => {
    pairs.forEach(({ button, tip }) => {
      button.classList.remove("is-open");
      tip.classList.remove("is-open");
    });
  };

  pairs.forEach(({ button, tip }) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = tip.classList.contains("is-open");
      closeAll();
      button.classList.toggle("is-open", !open);
      tip.classList.toggle("is-open", !open);
    });
  });

  documentObject.addEventListener("click", closeAll);
  documentObject.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAll();
    }
  });
}

function initViewTabs(documentObject = document) {
  const viewTabs = Array.from(documentObject.querySelectorAll(".view-tab")).filter(
    (tab) => tab instanceof HTMLButtonElement && readViewName(tab.dataset.viewTarget)
  );
  const panelEntries = Array.from(documentObject.querySelectorAll("[data-view-panel]"))
    .filter(isHTMLElement)
    .map((panel) => [readViewName(panel.dataset.viewPanel), panel])
    .filter(([viewName]) => Boolean(viewName));

  if (!viewTabs.length || !panelEntries.length) {
    return;
  }

  const panelMap = new Map(panelEntries);
  const initialTab = viewTabs.find((tab) => tab.getAttribute("aria-selected") === "true") || viewTabs[0];
  const initialView = readViewName(initialTab.dataset.viewTarget) || "about";

  setActiveView(initialView, viewTabs, panelMap, documentObject.documentElement);

  viewTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      const targetView = readViewName(tab.dataset.viewTarget);

      if (targetView) {
        setActiveView(targetView, viewTabs, panelMap, documentObject.documentElement);
      }
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();

      let nextIndex = index;
      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % viewTabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + viewTabs.length) % viewTabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = viewTabs.length - 1;
      }

      const nextTab = viewTabs[nextIndex];
      const nextView = readViewName(nextTab.dataset.viewTarget);

      if (!nextView) {
        return;
      }

      setActiveView(nextView, viewTabs, panelMap, documentObject.documentElement);
      nextTab.focus();
    });
  });
}

function initHomepageUi(documentObject = document, windowObject = window) {
  const themeState = getThemeState(windowObject);
  const motionState = getMotionState(windowObject);
  const dyslexiaState = getDyslexiaState(windowObject);

  initThemeControls(themeState, documentObject);
  initMotionControls(motionState, documentObject);
  initDyslexiaControls(dyslexiaState, documentObject);
  initContactLinks(documentObject);
  initInfoButtons(documentObject);
  initViewTabs(documentObject);
  windowObject.homepageUiReady = true;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHomepageUi(document, window);
    });
  } else {
    initHomepageUi(document, window);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    VIEW_NAMES,
    getDyslexiaState,
    getMotionState,
    getThemeState,
    clearPanelMotion,
    refreshActivePanelMotion,
    initContactLinks,
    initDyslexiaControls,
    initHomepageUi,
    initInfoButtons,
    initMotionControls,
    initThemeControls,
    initViewTabs,
    readViewName,
    restartPanelEntrance,
    setActiveView,
  };
}
