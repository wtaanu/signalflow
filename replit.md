# SignalFlow

## Overview

Full-stack LinkedIn lead capture system with a Chrome Extension and web dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS
- **Build**: esbuild (server), Vite (frontend)

## Structure

```text
signalflow/
├── artifacts/
│   ├── api-server/          # Express 5 API backend
│   └── dashboard/           # React + Vite dark-mode dashboard
├── extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── content.js           # Injects "✨ Save Lead" button on LinkedIn
│   ├── popup.html/js        # Extension settings popup
│   └── icons/               # Extension icons
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen config
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + DB connection
```

## API Endpoints

- `GET /api/leads` — get all saved leads
- `POST /api/save-lead` — save a new lead (requires `x-api-key` header)
- `DELETE /api/leads/:id` — delete a lead by ID

## Authentication

The `POST /api/save-lead` endpoint requires the `SIGNALFLOW_API_KEY` secret in the `x-api-key` header.

## Database Schema

**leads** table:
- `id` (serial, PK)
- `name` (text, not null)
- `title` (text, nullable)
- `profile_url` (text, not null)
- `ai_draft` (text, nullable)
- `created_at` (timestamp, default now)

## Chrome Extension Setup

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Click the ⚡ icon → enter your dashboard URL + API key

## Key Packages

- `artifacts/dashboard`: `framer-motion`, `lucide-react`, `date-fns`, `@tanstack/react-query`
- `artifacts/api-server`: `express`, `drizzle-orm`, `pg`, `pino`
