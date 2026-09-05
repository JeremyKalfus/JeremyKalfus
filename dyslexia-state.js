const DYSLEXIA_STORAGE_KEY = "dyslexia";
const DEFAULT_DYSLEXIA = "off";

function normalizeDyslexia(value) {
  return value === "on" || value === "off" ? value : DEFAULT_DYSLEXIA;
}

function isRecoverableStorageError(error) {
  return Boolean(
    error &&
      (error.name === "SecurityError" ||
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function readStoredDyslexia(storage = window.localStorage) {
  try {
    return normalizeDyslexia(storage.getItem(DYSLEXIA_STORAGE_KEY));
  } catch (error) {
    if (isRecoverableStorageError(error)) {
      return DEFAULT_DYSLEXIA;
    }

    throw error;
  }
}

function persistDyslexia(dyslexia, storage = window.localStorage) {
  const normalizedDyslexia = normalizeDyslexia(dyslexia);

  try {
    storage.setItem(DYSLEXIA_STORAGE_KEY, normalizedDyslexia);
  } catch (error) {
    if (!isRecoverableStorageError(error)) {
      throw error;
    }
  }

  return normalizedDyslexia;
}

function applyDyslexia(dyslexia, root = document.documentElement) {
  const normalizedDyslexia = normalizeDyslexia(dyslexia);

  root.classList.toggle("dyslexia-friendly", normalizedDyslexia === "on");
  root.dataset.dyslexia = normalizedDyslexia;

  return normalizedDyslexia;
}

function resolveInitialDyslexia(root = document.documentElement, storage = window.localStorage) {
  const rootDyslexia = root.dataset.dyslexia;

  if (rootDyslexia) {
    return normalizeDyslexia(rootDyslexia);
  }

  return readStoredDyslexia(storage);
}

function applyStoredDyslexia(root = document.documentElement, storage = window.localStorage) {
  return applyDyslexia(readStoredDyslexia(storage), root);
}

const homepageDyslexia = Object.freeze({
  applyDyslexia,
  applyStoredDyslexia,
  persistDyslexia,
  readStoredDyslexia,
  resolveInitialDyslexia,
});

if (typeof window !== "undefined") {
  window.homepageDyslexia = homepageDyslexia;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = homepageDyslexia;
}
