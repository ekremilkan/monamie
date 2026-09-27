const sanitizeBase = (url: string) => url.replace(/\/+$/, "");

const rawPort = import.meta.env.PUBLIC_API_PORT;
const defaultPort = (rawPort && rawPort.trim()) || "3000";

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    return sanitizeBase(envUrl);
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const hostname = window.location.hostname;
    const portSegment = defaultPort ? `:${defaultPort}` : "";
    return sanitizeBase(`${protocol}//${hostname}${portSegment}`);
  }

  return sanitizeBase(`http://localhost:${defaultPort}`);
};

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
