const API = import.meta.env.VITE_API_URL;

export async function isAuthenticated() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });
    
    return res.ok;
  } catch {
    return false;
  }
}