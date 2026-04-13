# Task 01 — Monorepo Scaffold

Read CLAUDE.md and ARCHITECTURE.md before starting.

## Goal

Set up the monorepo directory structure and configuration. No app code yet — just the skeleton that everything else will be built inside.

## Acceptance Criteria

- [ ] Root `package.json` with pnpm workspaces configured for `apps/*` and `packages/*`
- [ ] `pnpm-workspace.yaml` listing all workspaces
- [ ] `.npmrc` with `shamefully-hoist=true` for Expo compatibility
- [ ] Root `tsconfig.json` with path aliases for `@boxtrack/core`
- [ ] `apps/mobile/` — bare Expo project (TypeScript template), Expo Router installed, `tsconfig.json` extending root
- [ ] `apps/web/` — bare Vite + React project (TypeScript template), `tsconfig.json` extending root
- [ ] `packages/core/` — empty package with `package.json`, `tsconfig.json`, `src/index.ts` exporting nothing yet
- [ ] Root `.gitignore` covering node_modules, .expo, dist, .env files
- [ ] Root `.prettierrc` matching CLAUDE.md style (tabs, single quotes, no trailing commas, 100-char width)
- [ ] Root `eslint.config.js` with TypeScript rules

## Verification

Run these from the repo root and confirm they all succeed with no errors:

```bash
pnpm install
cd apps/mobile && pnpm run type-check
cd apps/web && pnpm run type-check
cd packages/core && pnpm run type-check
```

Do not proceed if any type errors exist. Fix them before finishing.
