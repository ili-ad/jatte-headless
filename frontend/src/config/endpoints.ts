const ENV_API = process.env.NEXT_PUBLIC_API_URL;
function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveWsBase(
  envValue = process.env.NEXT_PUBLIC_WS_URL,
  location: Pick<Location, "protocol" | "hostname"> | null | undefined =
    typeof window === "undefined" ? undefined : window.location,
): string {
  const explicit = envValue?.trim();
  if (explicit) return trimTrailingSlash(explicit);

  if (location == null) return "ws://127.0.0.1:8000";

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const hostname = location.hostname || "127.0.0.1";
  const host = hostname.includes(":") && !hostname.startsWith("[")
    ? `[${hostname}]`
    : hostname;
  return `${proto}://${host}:8000`;
}

export const API_BASE: string = (ENV_API && ENV_API.trim()) || "";
export const WS_BASE: string = resolveWsBase();

export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
