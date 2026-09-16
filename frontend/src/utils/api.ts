import { isGuestMode } from "../demo/demoStore";
import { handleDemoRequest } from "../demo/demoApi";

// Local default for `npm run dev`; hosting sets VITE_API_URL at build time.
const API = (
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const join = (endpoint: string) =>
  endpoint.startsWith("/") ? `${API}${endpoint}` : `${API}/${endpoint}`;

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Guest/Demo Mode: serve mock data entirely in the browser (never hit Django).
  if (isGuestMode()) {
    return handleDemoRequest(endpoint, options);
  }

  const token = localStorage.getItem("access_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(join(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (text.trim().startsWith("<!")) {
        throw new Error(
          `Server returned HTML error page (${response.status}). Check API URL: ${join(endpoint)}`
        );
      }
    }
  }

  if (response.status === 401 && token) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        const refreshResponse = await fetch(join("/auth/refresh/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem("access_token", data.access);

          headers["Authorization"] = `Bearer ${data.access}`;
          return fetch(join(endpoint), {
            ...options,
            headers,
          });
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
  }

  return response;
};
