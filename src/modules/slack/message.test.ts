import { describe, expect, it } from "vitest";

import { buildSlackMessage } from "./message";

describe("Slack message builder", () => {
  it("builds a useful issue notification", () => {
    const message = buildSlackMessage({
      repository: "octo/repo",
      resourceNumber: 7,
      eventType: "issues",
      title: "Bug report",
      author: "octocat",
    });

    expect(message.text).toContain("octo/repo#7");
    expect(message.text).toContain("https://github.com/octo/repo/issues/7");
  });

  it("escapes Slack control characters from untrusted content", () => {
    const message = buildSlackMessage({
      repository: "octo/repo",
      resourceNumber: 7,
      eventType: "issues",
      title: "<!channel> & test",
      author: "<@U123>",
    });

    expect(message.text).not.toContain("<!channel>");
    expect(message.text).toContain("&lt;!channel&gt; &amp; test");
  });
});
