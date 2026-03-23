# SignalFlow — LinkedIn Lead Capture CRM

A full-stack LinkedIn lead capture system with an AI-powered connection request drafter, a premium dark-mode dashboard, and a Chrome Extension that injects a save button directly into LinkedIn profiles.

---

## What It Does

1. **Chrome Extension** — Visit any LinkedIn profile and click **✨ Save to SignalFlow**. The extension scrapes the person's name, title, and About section, then sends it to your API.
2. **AI Draft Generation** — The API uses GPT to generate a personalized, low-cringe LinkedIn connection request (no salutations, no flattery, peer-to-peer tone, ≤150 characters).
3. **Dashboard** — Review all saved leads, copy the AI draft with one click, open a pre-filled LinkedIn message thread, or delete leads you no longer need.

---

## Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL (Drizzle ORM) |
| AI | OpenAI GPT (via Replit AI Integration) |
| Dashboard | React + Vite + Tailwind CSS |
| Chrome Extension | Manifest V3 (vanilla JS) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
signalflow/
├── artifacts/
│   ├── api-server/          # Express API (save lead, list leads, delete lead)
│   │   └── src/
│   │       ├── routes/leads.ts   # Core API routes + AI draft generation
│   │       └── lib/logger.ts     # Pino logger
│   └── dashboard/           # React + Vite dark-mode dashboard
│       └── src/
│           ├── pages/dashboard.tsx   # Leads table with copy + message buttons
│           ├── pages/settings.tsx    # API key + extension setup guide
│           └── hooks/use-leads-data.ts
├── lib/
│   ├── db/                  # Drizzle schema + PostgreSQL client
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   └── api-zod/             # Zod validators generated from OpenAPI spec
├── extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── content.js           # Injects floating "✨ Save to SignalFlow" button
│   ├── popup.html           # Settings UI (API URL + key)
│   └── popup.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env` file or set the following secrets:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SIGNALFLOW_API_KEY=your_secret_api_key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...
AI_INTEGRATIONS_OPENAI_API_KEY=...
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run db:push
```

### 4. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

### 5. Start the dashboard

```bash
pnpm --filter @workspace/dashboard run dev
```

---

## API Reference

All endpoints require the `x-api-key` header.

### `POST /api/save-lead`

Save a LinkedIn lead and generate an AI connection request draft.

**Request body:**
```json
{
  "name": "Alex Kim",
  "title": "Staff Engineer at Notion",
  "profile_url": "https://linkedin.com/in/alexkim",
  "about_text": "Building collaborative infrastructure at Notion."
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Alex Kim",
  "title": "Staff Engineer at Notion",
  "profile_url": "https://linkedin.com/in/alexkim",
  "ai_draft": "Building collaborative infra at Notion — how do you approach conflict resolution at scale?",
  "created_at": "2026-03-23T04:36:05.064Z"
}
```

### `GET /api/leads`

Returns all saved leads, newest first.

### `DELETE /api/leads/:id`

Deletes a lead by ID.

---

## Chrome Extension

### Installation

1. Download or build the extension folder
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `extension/` folder
5. Click the SignalFlow icon in the toolbar → enter your **API URL** and **API Key** → Save

### How it works

- Runs on every `linkedin.com/in/*` page
- Injects a floating **✨ Save to SignalFlow** button in the bottom-right corner
- On click: scrapes name, title, and About section → POSTs to your API → shows success/error toast

---

## AI Draft Rules

The AI prompt enforces strict rules for every generated draft:

- No salutations ("Hi", "Hello")
- No flattery ("impressive", "inspiring", "amazing")
- Starts with a **specific observation** about their work (pattern interrupt)
- **Peer-to-peer founder tone** — direct and concise
- No exclamation marks
- **Maximum 150 characters**

**Example output:**
> *"Building collaborative infra at Notion — how do you approach conflict resolution at scale?"*

---

## Dashboard Features

- **Stats cards** — Total leads, AI drafts generated, saved this week
- **Search** — Filter leads by name or title
- **AI Draft column** — Preview inline, expand for full text
- **Copy Message** — One-click copy of the AI draft to clipboard
- **Message on LinkedIn** — Opens a pre-filled LinkedIn message thread (recipient + AI draft body auto-populated)
- **Delete** — Remove leads with confirmation dialog

---

## License

MIT
