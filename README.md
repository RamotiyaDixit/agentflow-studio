# AgentFlow Studio

AgentFlow Studio is a full-stack starter for building and running AI-powered workflow automations. It combines a polished workflow dashboard with a Node.js execution API, persistent run logs, and a MySQL database.

![AgentFlow Studio](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- Workflow library with status, step previews, search, and execution history.
- Create workflows from the dashboard, with configurable steps saved in MySQL.
- Run workflows and inspect the result, status, and step-by-step logs.
- Supported step types: AI generation, HTTP request, text transform, condition, and human approval checkpoint.
- OpenAI-compatible Chat Completions support; a mock AI response is used if no model key is configured.
- Sample automations for lead follow-up and support ticket triage.
- Docker Compose for local MySQL, environment examples, and GitHub Actions CI.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript, Lucide icons, custom responsive CSS.
- **Backend:** Node.js, Express, TypeScript, Zod validation.
- **Database:** MySQL 8.4 using `mysql2`.
- **AI:** OpenAI-compatible Chat Completions API (optional).
- **Local infrastructure:** Docker Compose.

## Repository structure

```text
agentflow-studio/
├── apps/
│   ├── web/                         # Next.js dashboard
│   │   ├── app/                     # UI and styles
│   │   └── lib/api.ts               # Typed API client
│   └── api/                         # Express API and workflow engine
│       ├── sql/schema.sql           # Tables and sample workflows
│       └── src/
│           ├── config/              # MySQL pool
│           ├── engine/runner.ts     # Workflow execution engine
│           ├── routes/              # Workflow and run endpoints
│           └── scripts/             # Database setup script
├── .env.example
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Requirements

- Node.js 20 or newer and npm
- Docker Desktop or a local MySQL 8 server
- Optional: an API key for an OpenAI-compatible model endpoint

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/dixit2812/agentflow-studio.git
cd agentflow-studio
```

### 2. Configure local environment

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

The API loads `apps/api/.env`. The Next.js app loads `apps/web/.env.local`. The sample configuration is for local development only. Do not commit real API keys or production secrets.

To enable real model responses, set `OPENAI_API_KEY` in `apps/api/.env`. You may adjust `OPENAI_BASE_URL` and `OPENAI_MODEL` for a compatible provider. Without a key, AI steps return an informative mock response so you can test the workflow plumbing.

### 3. Start MySQL

```bash
docker compose up -d db
```

The Compose file creates the `agentflow` database and local development user, then initializes the schema and sample workflows. MySQL initialization scripts run on the first creation of the data volume. If you change the schema and want a fresh development database, back up any data and use `docker compose down -v` before restarting; this deletes the local database volume.

### 4. Start the API

In a terminal:

```bash
cd apps/api
npm install
npm run db:setup
npm run dev
```

The API defaults to **http://localhost:4000**. Confirm it is responding at [http://localhost:4000/api/health](http://localhost:4000/api/health).

### 5. Start the web app

In a second terminal from the repository root:

```bash
cd apps/web
npm install
npm run dev
```

Open **http://localhost:3000**.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `PORT` | API | Express port (default `4000`) |
| `CORS_ORIGIN` | API | Comma-separated allowed frontend origins |
| `DB_HOST`, `DB_PORT` | API | MySQL host and port |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | API | Database credentials and database name |
| `OPENAI_API_KEY` | API | Optional model provider key |
| `OPENAI_BASE_URL` | API | OpenAI-compatible API base URL |
| `OPENAI_MODEL` | API | Model name (default `gpt-4o-mini`) |
| `NEXT_PUBLIC_API_URL` | Web | API base URL, default `http://localhost:4000/api` |

## API reference

All API routes are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/workflows` | List workflows |
| POST | `/workflows` | Create a workflow |
| GET | `/workflows/:id` | Retrieve a workflow |
| POST | `/workflows/:id/run` | Execute an active workflow with JSON input |
| GET | `/runs?limit=20` | List recent runs |
| GET | `/runs/:id` | Retrieve a run and its step logs |

### Example: create a workflow

```bash
curl -X POST http://localhost:4000/api/workflows \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Meeting summary",
    "description": "Summarize supplied meeting notes for review",
    "status": "active",
    "steps": [
      {
        "id": "summary",
        "name": "Summarize notes",
        "type": "ai",
        "config": {
          "prompt": "Summarize the notes. Use only facts in the supplied input."
        }
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

Run it by replacing `WORKFLOW_ID` with the returned ID:

```bash
curl -X POST http://localhost:4000/api/workflows/WORKFLOW_ID/run \
  -H 'Content-Type: application/json' \
  -d '{"input":{"text":"Paste meeting notes here"}}'
```

## Workflow steps

A workflow stores an ordered array of step objects:

- **`transform`** — applies simple input templates such as `{{input.text}}`.
- **`ai`** — sends the prompt and selected context to the model endpoint, or returns a mock response when no API key is configured.
- **`condition`** — checks whether the supplied input or a previous output key is truthy; stops the workflow if false.
- **`http`** — makes an HTTPS GET or POST request to the configured endpoint.
- **`approval`** — pauses execution with a `needs_approval` status for human review.

The current approval step is a checkpoint, not a complete approval/resume user interface. HTTP integrations are basic and should only be configured against trusted destinations.

## Development scripts

From `apps/api`:

- `npm run dev` — run the API with reload.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — start the compiled API.
- `npm run db:setup` — initialize the schema and sample workflows.

From `apps/web`:

- `npm run dev` — run Next.js locally.
- `npm run typecheck` — run the TypeScript check.
- `npm run build` — build the production frontend.
- `npm start` — serve the production frontend.

GitHub Actions runs the API build and frontend typecheck/build on pushes and pull requests to `main`.

## Security and production readiness

This is a development starter, not a hardened multi-tenant production system. Before exposing it publicly or using it with real customer data:

1. Add authentication, authorization, and per-workspace data isolation.
2. Store provider credentials in a dedicated secret store; never place API keys in workflow JSON.
3. Add strict URL allowlists, DNS/IP checks, redirect restrictions, and SSRF protection to HTTP steps.
4. Add execution queues, rate limits, quotas, request timeouts, cancellation, and bounded retries.
5. Implement a durable approval/resume flow before allowing sensitive external actions.
6. Add audit logs, monitoring, database backups, and automated integration tests.

## License

MIT. See [LICENSE](./LICENSE).
