# Domain modules

Business logic belongs in domain-focused modules rather than Route Handlers or React components.

The approved boundaries are `actions`, `ai`, `audit`, `auth`, `events`, `github`, `jobs`, `rules`, `slack`, and `webhooks`. Each directory is reserved by a `.gitkeep` file until its milestone adds real code. `system` contains foundation-level service behavior such as the health response.
