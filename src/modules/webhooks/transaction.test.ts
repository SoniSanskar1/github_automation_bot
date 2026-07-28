import { describe, expect, it, vi } from "vitest";

import { insertEventAndJob } from "./transaction";

describe("transactional webhook insertion", () => {
  it("does not create another job for a duplicate delivery", async () => {
    const insertJob = vi.fn();

    await expect(
      insertEventAndJob({
        insertEvent: async () => undefined,
        insertJob,
      }),
    ).resolves.toEqual({ status: "duplicate" });
    expect(insertJob).not.toHaveBeenCalled();
  });

  it("propagates job failures so the database transaction rolls back", async () => {
    await expect(
      insertEventAndJob({
        insertEvent: async () => "event-id",
        insertJob: async () => {
          throw new Error("job_insert_failed");
        },
      }),
    ).rejects.toThrow("job_insert_failed");
  });
});
