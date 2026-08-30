export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://replay-backend-dq8p.onrender.com";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(fullUrl, {
    ...options,
    credentials: "include",
    headers,
  });
}
