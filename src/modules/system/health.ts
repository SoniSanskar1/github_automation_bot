export const HEALTH_RESPONSE = {
  service: "repopilot",
  status: "ok",
} as const;

export function createHealthResponse() {
  return HEALTH_RESPONSE;
}
