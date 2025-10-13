const ENV_API = process.env.NEXT_PUBLIC_API_URL;
const ENV_WS = process.env.NEXT_PUBLIC_WS_URL;

function defaultWsBase(): string {
  if (typeof window === "undefined") {
    return "ws://127.0.0.1:8000";
  }

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "127.0.0.1";
  return `${proto}://${host}:8000`;
}

export const API_BASE: string = (ENV_API && ENV_API.trim()) || "";
export const WS_BASE: string = (ENV_WS && ENV_WS.trim()) || defaultWsBase();

export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
