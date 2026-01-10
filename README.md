# TanStack Playground

A playground app built with TanStack Start for testing npm libraries and APIs.

## Tech Stack

- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Build**: Vite + Nitro
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

---

## Features

### 1. Screenshot API (Puppeteer)

Capture screenshots of any page or specific DOM elements using server-side Puppeteer.

**Library**: `puppeteer`

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/snapshot` | Capture a screenshot |
| GET | `/api/snapshot/:id` | Retrieve a screenshot |

#### Usage

**Capture full page:**
```bash
curl -X POST http://localhost:3000/api/snapshot \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000"}'
```

**Capture specific element:**
```bash
curl -X POST http://localhost:3000/api/snapshot \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000", "selector": ".grid > div:first-child"}'
```

**Response:**
```json
{
  "id": "1766738085529-4tqf4c",
  "snapshotUrl": "/api/snapshot/1766738085529-4tqf4c"
}
```

**View screenshot:** Open `http://localhost:3000/api/snapshot/{id}` in your browser.

#### How It Works

```
POST /api/snapshot
       │
       ▼
Generate unique ID
       │
       ▼
Puppeteer launches headless Chrome
  → Navigate to URL
  → Wait for page load
  → Capture element or full page
       │
       ▼
Save PNG to /screenshots/{id}.png
       │
       ▼
Return { id, snapshotUrl }
```

#### Files

| File | Purpose |
|------|---------|
| `src/routes/api/snapshot.ts` | POST endpoint |
| `src/routes/api/snapshot.$id.ts` | GET endpoint (serve images) |
| `src/server/screenshot.ts` | Puppeteer utility |
| `screenshots/` | PNG storage (gitignored) |

---

## Adding New Features

This playground is designed for experimenting. To add a new feature:

1. Install the npm package: `pnpm add <package>`
2. Create API routes in `src/routes/api/`
3. Add server utilities in `src/server/`
4. Document it in this README

---

## Project Structure

```
src/
├── routes/           # File-based routing
│   ├── api/          # API endpoints
│   └── index.tsx     # Home page
├── server/           # Server-side utilities
├── components/       # React components
└── data/             # Data utilities
```

---

## TanStack Start Basics

### Adding Routes

Add new files in `src/routes/`. TanStack Router auto-generates routes based on file names.

```tsx
// src/routes/about.tsx -> /about
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: () => <div>About Page</div>,
})
```

### Adding API Endpoints

```tsx
// src/routes/api/hello.ts -> /api/hello
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello World' }),
    },
  },
})
```

### Server Functions

```tsx
import { createServerFn } from '@tanstack/react-start'

const getData = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Runs on server
    return { data: 'from server' }
  })

// Call from component
const result = await getData()
```

---

## Learn More

- [TanStack Start Docs](https://tanstack.com/start)
- [TanStack Router Docs](https://tanstack.com/router)
