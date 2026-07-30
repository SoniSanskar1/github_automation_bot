# Dashboard visual polish

## Purpose

Apply the Stitch “Terminal Velocity” visual direction to RepoPilot so the
completed assessment feels like a cohesive developer product without changing
its tested automation behavior.

## Current state

The application already has a public landing page and one authenticated
dashboard route. `src/app/dashboard/page.tsx` composes overview metrics, rule
management, event history, and connected repositories. Server Actions and
server-only services own every mutation. Styling is currently a light,
utility-class interface.

The supplied Stitch package contains static HTML mockups for landing,
dashboard, and history views. It includes invented navigation, fake activity,
and outdated “planned” copy, so it cannot be copied directly.

## Scope

### Included

- Dark slate and mint RepoPilot design system.
- Responsive landing page.
- Responsive authenticated dashboard shell with in-page navigation.
- Dedicated overview, rules, history, and repositories routes inside one
  authenticated dashboard layout.
- Restyled metrics, rules, repositories, event history, AI results, alerts,
  forms, buttons, loading states, and empty states.
- Correct production copy using real server data.
- GitHub App permission documentation correction discovered during live PR
  testing.

### Excluded

- New routes, search, notifications, settings, support, or account features.
- Backend, database, authentication, webhook, job, rule, Slack, or AI changes.
- New dependencies or external image assets.

## Acceptance criteria

- Existing forms and Server Actions keep their current targets and fields.
- Dashboard navigation opens dedicated overview, rules, history, and
  repositories pages and indicates the active page.
- All visible counts, repositories, rules, events, and statuses remain sourced
  from the existing server queries.
- Landing and dashboard remain usable on mobile and desktop.
- Success, pending, failure, and disabled states are visually distinct.
- Type check, lint, tests, and production build pass.

## Architecture and flow

The server-rendered page and existing client refresh/button components remain
unchanged in responsibility. This task only changes markup hierarchy, copy, and
styles. No new data writes or external calls are introduced.

## Data model changes

None.

## Security analysis

No trust boundary changes. Authentication remains server-side, forms still use
the existing Server Actions, and no user or secret data is added to the client.
External Stitch image URLs and invented controls are not imported.

## Reliability analysis

The automation path is unchanged. Visual states continue to reflect persisted
job/action data. Existing pending-button behavior prevents repeated form
submission while a request is active.

## Implementation milestones

1. Define the global dark design tokens and landing page.
2. Restyle the dashboard shell, overview, and repository section.
3. Restyle rule management and event history.
4. Run all automated checks and inspect the resulting pages.
5. Update learning and AI collaboration evidence.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Manually verify landing, authenticated dashboard, anchors, rule forms,
  status toggles, sign-out, and responsive layouts in the preview deployment.

## Rollback or recovery

The work is isolated on `style/dashboard-polish`. Reverting the visual commit
restores the previous interface without touching stored data or integrations.

## Progress

- [x] Inspect current components and Stitch source.
- [x] Implement the visual system.
- [x] Split real dashboard sections into focused routes.
- [x] Run automated verification.
- [ ] Record manual preview evidence.

## Decisions and discoveries

- Treat Stitch as a reference rather than source of truth because it invented
  unsupported controls and stale copy.
- Add routes only for the four sections that already have real product
  behavior; do not add decorative Settings, Support, or Account pages.
- Use local CSS and existing Tailwind support; add no UI or icon dependency.
- Solid mint interactive surfaces use enforced near-black foreground text;
  translucent semantic status surfaces retain colored foreground text.
- Dashboard history timestamps are formatted for `Asia/Kolkata` and visibly
  labeled `IST`; stored timestamps remain UTC.
- Production pull-request testing proved that adding a label to a pull request
  requires Pull requests read/write permission, not read-only permission. The
  security guide was corrected.

## Learning summary

The static Stitch HTML describes appearance, while the Next.js components own
real data and behavior. The safe integration kept Server Components, Server
Actions, field names, action targets, and tenant-scoped queries intact, then
replaced only markup hierarchy and styles. This is similar to changing Django
templates or a Spring MVC view without changing controllers and services.
