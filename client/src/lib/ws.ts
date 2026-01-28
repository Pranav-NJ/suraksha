export const getBackendWsUrl = () => {
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (envUrl) {
    const normalized = envUrl.endsWith("/ws")
      ? envUrl
      : envUrl.replace(/\/+$/, "") + "/ws";
    return normalized;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  const port = window.location.port;
  const devPorts = new Set(["5173", "5174", "5175"]);
  const resolvedPort = devPorts.has(port) ? "5000" : port;
  const portPart = resolvedPort ? `:${resolvedPort}` : "";

  return `${protocol}//${host}${portPart}/ws`;
};
