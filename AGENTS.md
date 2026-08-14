# saoudi.online Codex Instructions

These instructions apply to every Codex task in this repository.

## Source of truth

- Read `.agents/agents.md` for project identity, architecture, environment variables, and current conventions.
- Before modifying files, read every Markdown file in `.agents/rules/`. Those rules are always on and are authoritative.
- Also read rules in `.trae/rules/` and `.devin/rules/` that relate to the task. The `.trae` rules mostly mirror `.agents`; `.devin/rules/rules.md` supplies additional constraints.
- Resolve conflicts in this order: `.agents/rules/` (canonical), then `.trae/rules/`, then `.devin/rules/`. In particular, increment versions at the end as required by `.agents/rules/version-increment.md`, and use the canonical Google colors from `.agents/rules/design-system.md`.
- Use the relevant skill in `.agents/skills/` when a task matches its description.
- Consult `.agents/sidecars/` when the task touches the file map, known issues, or roadmap status.
- Native Codex command policies live in `.codex/rules/default.rules`.
- Native Codex lifecycle guards live in `.codex/hooks.json` and `.codex/hooks/`.

## Non-negotiable project constraints

- Use `pnpm` exclusively; never use npm or Yarn.
- Keep Astro in SSR mode with `output: 'server'` and the Vercel adapter.
- Public routes must remain zero-JavaScript Astro pages. Do not add client directives, browser data fetching, or the Firebase Client SDK to public routes.
- Client-side JavaScript and React islands are allowed only under `/admin`.
- Keep admin routes under `src/pages/admin/` with the `admin_` filename prefix.
- Keep Firebase credentials and server-only environment variables out of client code and committed files.
- Use Tailwind CSS v4 tokens in `src/styles/global.css`; do not introduce a color-oriented `tailwind.config.js`.
- Do not add animation, masonry, or public-route client data-fetching libraries prohibited by `.agents/rules/architecture.md`.
- Preserve the Material 3 dark-mode and Google-brand design constraints in `.agents/rules/design-system.md`.
- Give dynamic images and media explicit aspect ratios to prevent layout shifts.
- Use solid Material 3 surface-container tonal elevations; do not introduce transparent blurred content surfaces.
- Never use visual shadows of any kind, including CSS `box-shadow`, `text-shadow`, `filter: drop-shadow()`, SVG `<feDropShadow>`, or shadow-producing Tailwind utilities. Use solid surfaces, borders, rings, color changes, or transforms instead.
- Obfuscate public Email, Telegram, and WhatsApp contact values with Base64 and decode them only on direct user intent.
- Preserve the delete-before-upload lifecycle when replacing resume or other Storage assets.
- Do not introduce new Firestore collections or entry-type literals without reconciling the requested change with `.devin/rules/rules.md` and the repository's existing multi-collection schema.
- Preserve existing comments and docstrings unless the surrounding code is directly changed.

## Verification & Git Automation

- Run `pnpm run check` after code changes when practical.
- Run `pnpm run build` for changes that can affect production output.
- Before finishing any task, follow `.agents/rules/version-increment.md` exactly and silently.
- After finishing each task/prompt, stage, commit, and push all changes (`git add .`, `git commit -m "<concise description of changes>"`, `git push`) per `.agents/rules/git-workflow.md`.
