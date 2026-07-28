# AI Work Log

Maintain this during implementation. Keep entries concise but specific. This file is evidence for the final `AI_NOTES.md`.

---

## Entry template

### YYYY-MM-DD HH:MM — <Task name>

**Human objective**

What outcome did I ask for?

**Prompt summary**

Summarize the instruction given to the AI. Do not paste an entire long conversation unless a small excerpt is genuinely useful.

**AI contribution**

What did Codex propose, generate, edit, test, or review?

**Human decisions and review**

What did I independently choose, reject, change, or verify?

**Verification evidence**

- Commands/tests run:
- Manual flow tested:
- Relevant commit/diff:
- External evidence:

**Problem, incorrect suggestion, or risk found**

State `None observed` when genuinely none was found. Do not invent one.

**Correction**

What changed, and who made/approved the correction?

**Learning**

What do I now understand well enough to explain?

**AI_NOTES candidate**

`Yes` or `No`, with one sentence explaining why.

---

## Initial entry

### Project start — Architecture and context

**Human objective**

Define a deliverable architecture and a disciplined Codex workflow for the 72-hour GitHub automation assessment.

**Prompt summary**

Select a free, practical stack; prioritize end-to-end delivery, security, idempotency, durable processing, learning, and honest AI documentation.

**AI contribution**

AI helped compare stack options, structure the modular-monolith architecture, outline the event/outbox flow, and draft repository context files.

**Human decisions and review**

The candidate must review and explicitly accept or change every decision before implementation. The current proposed decisions are recorded in `docs/DECISIONS.md`.

**Verification evidence**

No application code or live integration has been verified yet.

**Problem, incorrect suggestion, or risk found**

None observed yet. This entry must not be used as the final hardest-bug story.

**Correction**

Not applicable.

**Learning**

Context and instruction files are useful only when they remain synchronized with real implementation and test evidence.

**AI_NOTES candidate**

Yes, for explaining the initial division of work and planning approach; no, for the hardest-bug section.
