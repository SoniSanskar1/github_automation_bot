import { describe, expect, it } from "vitest";

import { isManuallyRetryableFailure } from "./manual-retry";

describe("manual retry policy", () => {
  it.each([
    "temporary_processing_failure",
    "github_network_error",
    "github_http_429",
    "github_http_500",
    "github_http_503",
    "slack_http_429",
    "slack_http_502",
  ])("allows exhausted temporary failure %s", (errorCode) => {
    expect(isManuallyRetryableFailure(errorCode)).toBe(true);
  });

  it.each([
    null,
    "invalid_event_payload",
    "invalid_rule_configuration",
    "github_http_403",
    "github_http_422",
    "slack_http_400",
    "slack_unknown_outcome",
  ])("blocks permanent or ambiguous failure %s", (errorCode) => {
    expect(isManuallyRetryableFailure(errorCode)).toBe(false);
  });
});
