const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

function normalizeTheme(value) {
  return value === "dark" ? "dark" : DEFAULT_THEME;
}

function isRecoverableStorageError(error) {
  return Boolean(
    error &&
      (error.name === "SecurityError" ||
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function readStoredTheme(storage = window.localStorage) {
  try {
    return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
  } catch (error) {
    if (isRecoverableStorageError(error)) {
      return DEFAULT_THEME;
    }

    throw error;
  }
}

function persistTheme(theme, storage = window.localStorage) {
  const normalizedTheme = normalizeTheme(theme);

  try {
    storage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch (error) {
    if (!isRecoverableStorageError(error)) {
      throw error;
    }
  }

  return normalizedTheme;
}

function applyTheme(theme, root = document.documentElement) {
  const normalizedTheme = normalizeTheme(theme);
  const isDark = normalizedTheme === "dark";

  root.classList.toggle("dark-mode", isDark);
  root.dataset.theme = normalizedTheme;

  return normalizedTheme;
}

function resolveInitialTheme(root = document.documentElement, storage = window.localStorage) {
  const rootTheme = root.dataset.theme;

  if (rootTheme) {
    return normalizeTheme(rootTheme);
  }

  return readStoredTheme(storage);
}

function applyStoredTheme(root = document.documentElement, storage = window.localStorage) {
  return applyTheme(readStoredTheme(storage), root);
}

const homepageTheme = Object.freeze({
  applyTheme,
  applyStoredTheme,
  persistTheme,
  readStoredTheme,
  resolveInitialTheme,
});

if (typeof window !== "undefined") {
  window.homepageTheme = homepageTheme;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = homepageTheme;
}
