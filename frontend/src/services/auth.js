const API = import.meta.env.VITE_API_URL;

let cachedAuth = null;

export async function isAuthenticated() {
  if (cachedAuth !== null) return cachedAuth;

  try {
    cachedAuth = Boolean(localStorage.getItem("token"));
    return cachedAuth;
  } catch {
    return false;
  }
}
