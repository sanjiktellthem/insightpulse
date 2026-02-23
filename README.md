# InsightPulse

InsightPulse is a single-page AI analytics copilot with an **Insight Cards** UX. It supports EN/RU chat, safe SQL execution on PostgreSQL, structured outputs (answer + SQL + rows + charts + dashboard cards), and optional Make webhook automation.

## Stack

- Next.js App Router + TypeScript + Tailwind + shadcn-style UI primitives
- Recharts for visualizations
- PostgreSQL + Docker Compose
- Prisma ORM
- OpenAI Responses API (`openai` official SDK)
- Optional Make/Integromat webhook integration

## 1) Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm prisma generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open: `http://localhost:3000`

## 2) Environment variables

- `DATABASE_URL` - main Prisma URL (read/write)
- `DATABASE_URL_READONLY` - read-only SQL execution URL used by runtime SQL tool
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-5.2`)
- `MAKE_WEBHOOK_URL` (optional)
- `NEXT_PUBLIC_DEMO_MODE` (defaults to true)

## 3) Key API routes

- `POST /api/chat`
  - Input:
    ```json
    { "conversationId":"optional", "message":"...", "locale":"en|ru", "enableMake":true, "makeContext":{} }
    ```
  - Output:
    ```json
    {
      "conversationId": "...",
      "assistantMessage": "...",
      "insight": {
        "title": "...",
        "summary": "...",
        "tags": ["..."],
        "sql": "...",
        "columns": ["..."],
        "rows": [["..."]],
        "charts": []
      }
    }
    ```

- `POST /api/make/trigger`
- `GET /api/insights`
- `POST /api/insights`
- `GET /api/insights/:id`
- `POST /api/dashboard/pin`
- `GET /api/dashboard`

## 4) SQL safety

SQL execution is read-only and enforces:

- starts with `SELECT` or `WITH`
- blocks dangerous keywords (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.)
- semicolons are rejected
- `LIMIT <= 500` enforced

## 5) Demo auth mode

MVP uses demo mode (`demo-user`) to avoid local auth friction. You can layer simple credentials later without changing core insight workflows.

## 6) Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm db:push`
- `pnpm db:migrate`
- `pnpm db:seed`

