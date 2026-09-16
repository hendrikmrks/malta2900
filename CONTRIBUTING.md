# Contributing to Malta2900

Thanks for your interest in contributing to Malta2900! This is a hobby project, and the repository is public, so issues and pull requests are welcome. This document covers local setup and the conventions the project actually follows — please read it before opening a PR.

For anything non-trivial (new gameplay mechanics, schema changes, larger refactors), please open an issue first to discuss the approach before investing time in a PR. Small, focused fixes (bugs, typos, docs) don't need that step.

## Code of Conduct

By participating in this project, you're expected to uphold the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Local development setup

The project is Docker-only — there's no documented way to run `app` or `worker` outside containers, and that's intentional (see [Development Workflow](./README.md#development-workflow) in the README).

```bash
git clone https://github.com/hendrikmrks/malta2900.git
cd malta2900

cp .env.example .env
# edit .env and set your own POSTGRES_PASSWORD and NEXTAUTH_SECRET

docker network create proxy-net   # one-time, see README > Getting Started

docker compose up -d db           # wait until it's "healthy" (docker compose ps)
docker compose build app worker
docker compose up -d
```

The app is then at http://localhost:3900. After any code change, rebuild and restart:

```bash
docker compose up -d --build
```

The container runs `next dev` but without a bind mount of the source, so changes don't hot-reload — you need to rebuild. See the README's [Getting Started](./README.md#getting-started) and [Development Workflow](./README.md#development-workflow) sections for the full rundown, including the production deployment notes.

## Project structure: what to touch for which change

| Change | Where |
|---|---|
| UI, pages, React components | `app/src/app/` (App Router pages + API routes), `app/src/components/` |
| Server-side API behavior (auth, register, actions, trading, ...) | `app/src/app/api/**/route.ts` |
| Shared game logic used by the frontend/API (balancing constants, island generation, auth config) | `app/src/lib/` (`game.ts`, `islandGen.ts`, `auth.ts`, `world.ts`, `actions.ts`, ...) |
| Continuous world simulation (hunger/thirst decay, resolving timed actions, day/night, weather, merchant pricing) | `worker/index.js` — a plain, long-running Node.js process, independent of `app` |
| Translations | `app/src/lib/i18n/dictionaries` (German `de` is the default locale, plus `en` and `pt-BR`) |
| Database schema | `prisma/schema.prisma` and `prisma/migrations/` (see below) |
| One-off maintenance/backfill scripts | `scripts/` |

**Important repo-specific gotcha:** `worker/index.js` and `scripts/regenerate-island-regions.js` run as plain Node.js, with no TypeScript build step, so they intentionally **duplicate** logic and constants that also live in `app/src/lib` (e.g. balancing constants from `app/src/lib/game.ts`, island generation from `app/src/lib/islandGen.ts`). The duplication is called out in comments at the top of each file. If you change one side, check whether the other needs the same change — there's no shared build step that would catch a drift between them for you.

## Database / schema changes (Prisma)

Schema changes go through Prisma migrations, generated against a running database so the migration files land back in the repo (the `prisma/` directory is bind-mounted for this):

```bash
docker compose build app
docker compose run --rm -v "$(pwd)/prisma:/app/prisma" app sh -c "npx prisma migrate dev --name <name>"
docker compose build app worker
docker compose up -d
```

Commit the generated `prisma/migrations/<timestamp>_<name>/` folder along with your code change. `prisma migrate deploy` (used in production/on container start, see `app/Dockerfile`) only applies migrations that already exist — it doesn't generate them.

## Lint and tests

There's no test suite in this repository at the moment — don't assume one exists or is being run in CI.

`app/package.json` defines a `lint` script (`next lint`), but no ESLint config has been committed yet, so running it for the first time drops you into Next.js's interactive "How would you like to configure ESLint?" setup wizard rather than linting immediately:

```bash
docker compose run --rm app npm run lint
```

If you run this, keep whatever config you end up creating out of your PR unless you're intentionally introducing the project's first ESLint config (worth raising in an issue first, since it'll affect everyone's workflow). Until then, please just sanity-check your own `app/` changes by eye — there's no separate lint setup for `worker/` or `scripts/` either.

## Branching and pull requests

- Branch off the default branch (`master`) using a short, descriptive name, e.g. `fix/merchant-price-drift` or `feature/village-well-upgrade`.
- Keep PRs focused on one change; unrelated cleanups make review harder.
- Describe what changed and why in the PR description, and mention if it touches the Prisma schema (include the migration folder) or both `app` and `worker` (see the duplication note above).
- If your change is UI-visible, a screenshot or short description of what you tested is appreciated.
- Match the existing code style in the file you're editing rather than introducing a new one (e.g. the codebase currently uses German inline comments to explain non-obvious game-balancing decisions in some files, even though UI strings, docs and commit messages are in English — follow the convention already used in the file you're touching rather than converting it).

## Reporting bugs / suggesting features

Please use [GitHub Issues](https://github.com/hendrikmrks/malta2900/issues). For bug reports, include:

- What you did and what you expected vs. what happened.
- Steps to reproduce, if possible.
- Whether it's reproducible with a fresh `docker compose up` or only after specific game state (e.g. a particular building level, trade, or migration history).

For feature/gameplay suggestions, a short description of the idea and how it fits the project's scope (see [`BUILD_PLAN.md`](./BUILD_PLAN.md) for the design history and intent — e.g. no combat, no explicit quest system) is more useful than a full spec.
