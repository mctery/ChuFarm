export function getLocal(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (err) {
    console.error(`getLocal('${key}') failed:`, err);
    return null;
  }
}

export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`setLocal('${key}') failed:`, err);
  }
}

export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`removeLocal('${key}') failed:`, err);
  }
}

export function clearLocal() {
  try {
    localStorage.clear();
  } catch (err) {
    console.error("clearLocal() failed:", err);
  }
}

export function getToken() {
  return localStorage.getItem("x-token") || null;
}

export function getRefreshToken() {
  return localStorage.getItem("x-refresh-token") || null;
}

export function getUserInfo() {
  return getLocal("user_info");
}

/**
 * Force logout — clear storage and redirect to login.
 * Single source of truth for logout redirect logic.
 */
export function forceLogout() {
  localStorage.clear();
  window.location.href = "/";
}
