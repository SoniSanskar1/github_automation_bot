import { describe, expect, it } from "vitest";

import {
  createInstallationState,
  installationStatesMatch,
} from "./installation-state";

describe("installation state", () => {
  it("creates unpredictable state values", () => {
    expect(createInstallationState()).not.toBe(createInstallationState());
  });

  it("accepts only the exact state", () => {
    expect(installationStatesMatch("expected", "expected")).toBe(true);
    expect(installationStatesMatch("expected", "different")).toBe(false);
    expect(installationStatesMatch(undefined, "expected")).toBe(false);
  });
});
