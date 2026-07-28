import { randomBytes, timingSafeEqual } from "node:crypto";

export const INSTALLATION_STATE_COOKIE = "repopilot_install_state";
export const INSTALLATION_ID_COOKIE = "repopilot_installation_id";

export function createInstallationState() {
  return randomBytes(32).toString("base64url");
}

export function installationStatesMatch(
  expected: string | undefined,
  received: string | null,
) {
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}
