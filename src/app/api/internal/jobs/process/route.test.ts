import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { processPendingJobs } = vi.hoisted(() => ({
  processPendingJobs: vi.fn(),
}));

vi.mock("@/modules/jobs/worker", () => ({ processPendingJobs }));

import { POST } from "./route";

const secret = "worker-route-secret-that-is-at-least-32-characters";

describe("internal job worker route", () => {
  beforeEach(() => {
    vi.stubEnv("INTERNAL_WORKER_SECRET", secret);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    processPendingJobs.mockResolvedValue({
      claimed: 1,
      succeeded: 1,
      retrying: 0,
      failed: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    processPendingJobs.mockReset();
  });

  it("rejects requests without the internal secret", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/jobs/process", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(processPendingJobs).not.toHaveBeenCalled();
  });

  it("processes jobs for an authorized caller", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/jobs/process", {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "completed",
      claimed: 1,
      succeeded: 1,
      retrying: 0,
      failed: 0,
    });
  });
});
