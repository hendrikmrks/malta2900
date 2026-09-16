# Malta2900

**Malta2900** is a browser-based, post-apocalyptic survival management game. It's the year 2900 and the player wakes up on the shore of a Malta abandoned long ago — ruins, cisterns, and overgrown fig groves stand where a civilization used to be. There is no combat, no enemies, and no explicit quest system: the premise is atmosphere, not plot. The core loop is entirely about managing needs, gathering resources, growing food, crafting, and slowly building up a small homestead.

Unlike a real-time action game, Malta2900 is a **management game**: forms, buttons, progress bars, and small icons rather than a canvas character you steer around. You make decisions and start actions — gathering, farming, sleeping, crafting — that take real time to complete, and the world keeps simulating on the server even while you're offline. Log back in tomorrow and the vegetables you planted, or the sleep you started, will have finished on their own.

## Table of Contents

- [Gameplay](#gameplay)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Gameplay

- **Needs & survival**: Hunger and thirst drain continuously in real time, tracked server-side by a background worker — not by a client-side timer. Left unchecked, energy starts to drain too.
- **Resource gathering**: Collect figs, wood, water, vegetables, fish, and stone from procedurally placed resource regions on your own private island. Not every island has every resource type, which pushes players toward trading.
- **Farming & crafting**: Plant a vegetable garden and wait for it to grow, cook meals, and craft base buildings — a shelter, a fireplace, a well (passive water over time), a garden (passive vegetables over time), and a storehouse (slows hunger/thirst decay).
- **Building & customization**: Place your character and buildings on your island, lay down decorative path tiles, and choose a build site freely within your plot.
- **Day/night cycle & weather**: A shared, server-driven day/night cycle and weather system affect all players' islands simultaneously.
- **Light progression**: An XP/level system gives small, tangible bonuses without turning into a full skill tree.
- **Player-to-player trading**: An asynchronous marketplace where players post offers ("N of resource A for M of resource B"); the offered resource is held in escrow so trades can complete without both players being online at the same time.
- **Dynamic economy**: An NPC merchant buys and sells resources at prices that drift over time based on the ratio of coins to resources in circulation, with a historical price chart on the in-game economy page.
- **Multi-user**: Registration and login via email/password (the in-game username is a separate, changeable display name, not the login credential), with each account getting its own fully independent island, inventory, and progression.
- **Multi-language**: The UI is available in German, English, and Brazilian Portuguese.

The full, phase-by-phase design and build history lives in [`BUILD_PLAN.md`](./BUILD_PLAN.md).

## Architecture

The project is a small Docker Compose stack with three services:

| Service  | Responsibility |
|----------|-----------------|
| `app`    | Next.js 14 (App Router, TypeScript) — serves the frontend **and** the backend (API routes) from a single project. |
| `worker` | An independent Node.js process that continuously simulates the game world in the background — hunger/thirst decay, resolving time-based actions, day/night cycle, weather, passive building production, and the merchant's dynamic pricing — regardless of whether any player is currently online. |
| `db`     | PostgreSQL, accessed through [Prisma](https://www.prisma.io/) as the shared ORM for both `app` and `worker` (schema in [`prisma/schema.prisma`](./prisma/schema.prisma)). |

**Time-based actions** (gathering, sleeping, farming, ...) are stored server-side as start time + duration and resolved by the worker based on *actual* elapsed wall-clock time (via a `lastTickAt` field), not a fixed tick count — so progress is always correct even after the worker has been down for a while. The dashboard polls a lightweight, auth-protected API route periodically to reflect the current state without a full page reload.

**Authentication** uses [NextAuth.js](https://next-auth.js.org/) with the Credentials provider (email/password — email is the immutable login key, while the in-game username can be changed later — passwords hashed with bcrypt) and **JWT sessions** rather than database sessions — this is the standard approach in the NextAuth ecosystem for the Credentials provider, which does not support database sessions, and it avoids needing an additional DB adapter (Account/Session tables).

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript, React 18)
- [Prisma](https://www.prisma.io/) + PostgreSQL 16
- [NextAuth.js](https://next-auth.js.org/) (Credentials provider, JWT sessions, bcrypt password hashing)
- [Tailwind CSS](https://tailwindcss.com/)
- Plain Node.js worker process (no extra framework)
- Docker Compose for local development and deployment

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### First run

```bash
git clone https://github.com/hendrikmrks/malta2900.git
cd malta2900

cp .env.example .env
# then edit .env and set your own POSTGRES_PASSWORD and NEXTAUTH_SECRET
# (generate a secret with: openssl rand -base64 32)

docker network create proxy-net
# one-time, host-wide: docker-compose.yml attaches `app` to this external
# network (for an optional reverse proxy, see below); `docker compose up`
# fails with "network proxy-net ... could not be found" without it.

docker compose up -d db
# wait until the db container is "healthy" (docker compose ps)

docker compose build app worker
docker compose up -d
```

Database migrations are applied automatically when the `app` container starts (`prisma migrate deploy`, see [`app/Dockerfile`](./app/Dockerfile)).

The app is then available at **http://localhost:3900** (the app runs on port 3000 *inside* the container; it's mapped to host port 3900 in [`docker-compose.yml`](./docker-compose.yml) to avoid clashing with other local projects on port 3000 — adjust the mapping to taste).

For a production deployment behind your own reverse proxy (e.g. nginx, Caddy, Nginx Proxy Manager), point it at the `app` container's internal port 3000, set `NEXTAUTH_URL` in `.env` to your public HTTPS URL, and make sure `POSTGRES_PASSWORD` and `NEXTAUTH_SECRET` are replaced with your own random, secret values — never reuse the placeholders from `.env.example`.

## Environment Variables

See [`.env.example`](./.env.example) for the full list with descriptions. Docker Compose loads `.env` automatically; it is git-ignored and must never be committed.

| Variable | Purpose |
|----------|---------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials for the `db` service. |
| `DATABASE_URL` | Prisma connection string, must match the Postgres credentials above. |
| `NEXTAUTH_SECRET` | Secret used by NextAuth.js to sign session JWTs. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Public base URL of the app, used by NextAuth for callbacks. |

## Development Workflow

### After a schema change (new Prisma migration)

A new migration is generated locally against the running database and written to `prisma/migrations/` (bind-mounted so the migration files land back in the repo):

```bash
docker compose build app
docker compose run --rm -v "$(pwd)/prisma:/app/prisma" app sh -c "npx prisma migrate dev --name <name>"
docker compose build app worker
docker compose up -d
```

### After a code change

```bash
docker compose up -d --build
```

The project runs in `next dev` mode inside the container, but without a bind mount of the source code — so rebuild after changes instead of relying on hot reload.

## Project Structure

```
malta2900/
├── app/                  # Next.js app (frontend + API routes)
│   └── src/
│       ├── app/          # App Router pages and API routes
│       ├── components/   # Shared React components
│       └── lib/          # Game logic, auth, i18n, world/island generation
├── worker/               # Background world-simulation process
├── prisma/               # Shared Prisma schema and migrations
├── scripts/              # One-off maintenance/data scripts
├── docker-compose.yml
└── BUILD_PLAN.md         # Phase-by-phase design & implementation log
```

## Internationalization

The UI supports German (`de`, default), English (`en`), and Brazilian Portuguese (`pt-BR`). Translation dictionaries live in [`app/src/lib/i18n/dictionaries`](./app/src/lib/i18n/dictionaries), with the active locale stored per-user and in a cookie.

## Project Status

This is an actively evolving personal/hobby project. [`BUILD_PLAN.md`](./BUILD_PLAN.md) documents the original four core phases in detail; a look at [`prisma/migrations`](./prisma/migrations) shows the game has since grown well beyond that — movement & trading, building placement, onboarding, map regions, village progression, a dynamic currency system, and price history have all been added incrementally.

Development so far has leaned heavily on AI pair-programming (Claude Code), with `BUILD_PLAN.md` doubling as the working brief for that process — mentioned here for transparency, not as a disclaimer.

The repository is public on GitHub, with the game still actively taking shape.

## Contributing

Issues and pull requests are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, the app/worker split, database migrations, and the PR workflow. Please keep changes focused and, for anything non-trivial, open an issue first to discuss the approach before investing time in a PR.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) — see [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) for details. By participating, you're expected to uphold it.

## License

Malta2900 is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [`LICENSE`](./LICENSE) for the full text.

The AGPL was chosen specifically because Malta2900 is a persistent, server-simulated world rather than a piece of software you just run locally: it closes the "SaaS loophole" left open by licenses like GPL/MIT, requiring that anyone who runs a modified version of this game as a network service also makes their modified source available to the users of that service. If you'd rather use a more permissive license for your own fork, you're of course free to relicense your own contributions to the extent the AGPL allows, but the upstream project will stay AGPL-3.0.
