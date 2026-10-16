# AgentFlow Studio

AgentFlow Studio is a full-stack starter for building and running AI-powered workflow automations. It combines a polished workflow dashboard with a Node.js execution API, persistent run logs, and a MySQL database.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- Workflow dashboard with workflow statuses, step previews, search, and execution history.
- Create workflows through the UI; definitions and run logs persist in MySQL.
- Execute workflows and inspect final output, status, and step-by-step logs.
- Step types: AI generation, text transform, condition, HTTPS request, and human-approval checkpoint.
- OpenAI-compatible Chat Completions support; mock AI responses work without an API key.
- Seeded examples: **Lead Enrichment Assistant** and **Support Ticket Triage**.
- Docker Compose, example environment configuration, and GitHub Actions CI.

## Tech stack

- **Frontend:** Next.js App Router, React, TypeScript, Lucide icons, responsive custom CSS.
- **Backend:** Node.js, Express, TypeScript, Zod.
- **Database:** MySQL 8.4 and mysql2.
- **AI:** OpenAI-compatible Chat Completions API (optional).
- **Dev workflow:** Docker Compose and GitHub Actions.

## Repository layout

```text
agentflow-studio/
├── apps/
│   ├── web/                       # Next.js dashboard
│   │   ├── app/                   # UI, metadata and styling
│   │   └── lib/api.ts             # Typed API client
│   └── api/                       # Express API and workflow engine
│       ├── sql/schema.sql         # Tables and sample workflows
│       └── src/
│           ├── engine/runner.ts   # Sequential workflow runner
│           ├── routes/            # Workflow and run endpoints
│           ├── config/            # MySQL pool
│           └── scripts/           # Database initialization
├── .github/workflows/ci.yml
├── .env.example
├── docker-compose.yml
└── README.md
```

## Requirements

- Node.js 20+ and npm
- Docker Desktop or a local MySQL 8 server
- Optional API key for an OpenAI-compatible model endpoint

## Quick start

### 1. Clone and configure

```bash
git clone https://github.com/dixit2812/agentflow-studio.git
cd agentflow-studio
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

The API loads `apps/api/.env`; Next.js reads `NEXT_PUBLIC_API_URL` from `apps/web/.env.local`. The defaults are for local development only. Never commit real API keys or production credentials.

To enable real AI responses, set `OPENAI_API_KEY` in `apps/api/.env`. You can configure `OPENAI_BASE_URL` and `OPENAI_MODEL` for a compatible provider. With no key, AI steps return a mock response so you can test workflow plumbing without model costs.

### 2. Start MySQL

```bash
docker compose up -d db
```

On first initialization, Docker loads the schema and sample workflows. The API database setup script can also be run explicitly:

```bash
cd apps/api
npm install
npm run db:setup
npm run dev
```

The API runs at http://localhost:4000 by default. Health check: http://localhost:4000/api/health.

### 3. Start the web app

In another terminal from the repository root:

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000.

> The API database credentials must match `apps/api/.env` and `docker-compose.yml`.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Express port; defaults to `4000` |
| `CORS_ORIGIN` | Comma-separated frontend origins allowed by CORS |
| `DB_HOST`, `DB_PORT` | MySQL host and port |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL credentials and database |
| `OPENAI_API_KEY` | Optional model provider key |
| `OPENAI_BASE_URL` | OpenAI-compatible API base URL |
| `OPENAI_MODEL` | Model name; defaults to `gpt-4o-mini` |
| `NEXT_PUBLIC_API_URL` | API base URL for the frontend |

## REST API

All routes are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API health check |
| GET | `/workflows` | List all workflows |
| POST | `/workflows` | Create a workflow |
| GET | `/workflows/:id` | Get a workflow by ID |
| POST | `/workflows/:id/run` | Run an active workflow with JSON input |
| GET | `/runs?limit=20` | List recent workflow runs |
| GET | `/runs/:id` | Get a run and its per-step execution logs |

### Example: create a workflow

```bash
curl -X POST http://localhost:4000/api/workflows \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Meeting summary",
    "description": "Summarize notes for review",
    "status": "active",
    "steps": [
      {
        "id": "summary",
        "name": "Summarize notes",
        "type": "ai",
        "config": { "prompt": "Summarize the notes using only facts in the input." }
      },
      {
        "id": "review",
        "name": "Human review",
        "type": "approval",
        "config": { "message": "Review the summary before sharing it." }
      }
    ]
  }'
```

Run it with the returned workflow ID:

```bash
curl -X POST http://localhost:4000/api/workflows/WORKFLOW_ID/run \
  -H 'Content-Type: application/json' \
  -d '{"input":{"text":"Paste meeting notes here"}}'
```

## Workflow step types

- **`transform`** — supports simple templates such as `{{input.text}}` and `{{outputs.previousStepId}}`.
- **`ai`** — calls the configured model endpoint, or returns a mock response without an API key.
- **`condition`** — checks a truthy input/output key; a false condition stops the run.
- **`http`** — makes a basic HTTPS GET or POST request to the configured endpoint.
- **`approval`** — marks a run as `needs_approval` at a review checkpoint.

The approval step is currently a checkpoint only; an approve/reject/resume UI is not yet implemented. HTTP integrations should only target trusted destinations.

## Scripts

From `apps/api`:

- `npm run dev` — start the API with reload.
- `npm run build` — compile API TypeScript.
- `npm start` — start the compiled API.
- `npm run db:setup` — initialize tables and sample workflows.

From `apps/web`:

- `npm run dev` — local Next.js server.
- `npm run typecheck` — run TypeScript checks.
- `npm run build` — production build.
- `npm start` — serve the production build.

GitHub Actions builds the API and typechecks/builds the frontend on pushes and pull requests to `main`.

## Security and production checklist

This is a starter project, not a hardened multi-tenant production system. Before public deployment or real customer data:

1. Add authentication, authorization, and per-workspace data isolation.
2. Store provider credentials in a dedicated secrets store; never put API keys into workflow JSON.
3. Add URL allowlists, DNS/IP validation, redirect restrictions, and SSRF protections to HTTP steps.
4. Add execution queues, quotas, rate limits, retries, timeouts, and cancellation.
5. Implement durable approval and resume handling before enabling sensitive external actions.
6. Add audit logs, observability, database backups, integration tests, and migrations.

## License

MIT — see [LICENSE](./LICENSE).
