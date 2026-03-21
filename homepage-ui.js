const VIEW_NAMES = ["about", "portfolio"];

function isHTMLElement(node) {
  return node instanceof HTMLElement;
}

function isThemeToggle(node) {
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

function setActiveView(viewName, viewTabs, panelMap) {
  viewTabs.forEach((tab) => {
    const isActive = readViewName(tab.dataset.viewTarget) === viewName;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  panelMap.forEach((panel, panelName) => {
    const isActive = panelName === viewName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
}

function initThemeControls(themeState, documentObject = document) {
  const toggle = documentObject.querySelector(".theme-toggle-checkbox");
  const label = documentObject.querySelector(".theme-label");

  if (!isThemeToggle(toggle) || !isHTMLElement(label)) {
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

  setActiveView(initialView, viewTabs, panelMap);

  viewTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      const targetView = readViewName(tab.dataset.viewTarget);

      if (targetView) {
        setActiveView(targetView, viewTabs, panelMap);
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

      setActiveView(nextView, viewTabs, panelMap);
      nextTab.focus();
    });
  });
}

function initHomepageUi(documentObject = document, windowObject = window) {
  const themeState = getThemeState(windowObject);

  initThemeControls(themeState, documentObject);
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
    getThemeState,
    initHomepageUi,
    initThemeControls,
    initViewTabs,
    readViewName,
    setActiveView,
  };
}
