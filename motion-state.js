const MOTION_STORAGE_KEY = "animations";
const DEFAULT_MOTION = "off";

function normalizeMotion(value) {
  return value === "on" || value === "off" ? value : DEFAULT_MOTION;
}

function isRecoverableStorageError(error) {
  return Boolean(
    error &&
      (error.name === "SecurityError" ||
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function readStoredMotion(storage = window.localStorage) {
  try {
    return normalizeMotion(storage.getItem(MOTION_STORAGE_KEY));
  } catch (error) {
    if (isRecoverableStorageError(error)) {
      return DEFAULT_MOTION;
    }

    throw error;
  }
}

function persistMotion(motion, storage = window.localStorage) {
  const normalizedMotion = normalizeMotion(motion);

  try {
    storage.setItem(MOTION_STORAGE_KEY, normalizedMotion);
  } catch (error) {
    if (!isRecoverableStorageError(error)) {
      throw error;
    }
  }

  return normalizedMotion;
}

function applyMotion(motion, root = document.documentElement) {
  const normalizedMotion = normalizeMotion(motion);
  const animationsEnabled = normalizedMotion === "on";

  root.classList.toggle("animations-enabled", animationsEnabled);
  root.dataset.animations = normalizedMotion;

  return normalizedMotion;
}

function resolveInitialMotion(root = document.documentElement, storage = window.localStorage) {
  const rootMotion = root.dataset.animations;

  if (rootMotion) {
    return normalizeMotion(rootMotion);
  }

  return readStoredMotion(storage);
}

function applyStoredMotion(root = document.documentElement, storage = window.localStorage) {
  return applyMotion(readStoredMotion(storage), root);
}

const homepageMotion = Object.freeze({
  applyMotion,
  applyStoredMotion,
  persistMotion,
  readStoredMotion,
  resolveInitialMotion,
});

if (typeof window !== "undefined") {
  window.homepageMotion = homepageMotion;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = homepageMotion;
}
