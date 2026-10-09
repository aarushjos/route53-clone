# AWS Route 53 Clone

A clone of the AWS Route 53 console (hosted zones and DNS records) with a real backend and persistent storage. It recreates the Route 53 look and workflow; it does not run actual DNS.

**Live demo:** https://YOUR-APP.vercel.app
**Source:** https://github.com/YOUR-USERNAME/route53-clone
**Demo login** (pre-filled, just click _Sign in_): `admin@example.com` / `admin123`

> The demo uses one shared account and database, so data you create is visible to other visitors.

---

## Technologies

| Layer    | Tools                                                                 |
| -------- | --------------------------------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, TanStack Query               |
| UI       | Cloudscape Design System (the design system AWS uses for its console) |
| Backend  | FastAPI, Uvicorn, Pydantic v2                                         |
| Database | SQLite via SQLAlchemy 2                                               |
| Auth     | JWT in an httpOnly cookie, bcrypt password hashing                    |
| Hosting  | Vercel (frontend), Railway + Docker + persistent volume (backend)     |

---

## Features

- **Auth (mocked):** login, logout, session persistence, protected pages.
- **Hosted zones:** list, search, type filter, pagination, create, edit description, delete (type `delete` to confirm; refused while the zone has non-default records). New zones get default NS and SOA records.
- **DNS records** (A, AAAA, CAA, CNAME, MX, NS, PTR, SRV, TXT): list, search, type filter, pagination, create, edit, delete.
  - Per-type value validation (IPv4/IPv6, MX priority, SRV fields, quoted CAA, etc.).
  - No duplicate name + type, and a CNAME cannot share a name with another record.
  - "Add another record" creates several at once, all or nothing.
  - The SOA record and the zone's own NS record are protected.
- **Bulk delete:** multi-select records and delete them in one request (protected ones are skipped).
- **Dark mode:** gear icon in the top bar, remembered in the browser.
- **Route 53 look and feel:** top bar, full sidebar, breadcrumbs, tables, modals, notification banners, orange buttons. Dashboard, Health checks, Traffic policies, Resolver, Profiles and the other sidebar items are "Coming soon" pages.

---

## The process

1. Studied the real console and chose Cloudscape, since AWS builds its console with it.
2. Designed three tables and a REST API. Record values are stored as a JSON list so one record can hold several values.
3. Built in vertical slices, backend first: model, API, test in `/docs`, then frontend hook and UI, then commit. Order: foundation, auth, shell, zones, records.
4. Kept all rules on the server (validation, conflicts, protected records) and mirrored them in the UI with disabled buttons and clear messages.
5. Compared side-by-side screenshots against the real console and closed the gaps, then added bulk delete and dark mode.
6. Deployed: Vercel for the frontend, Railway with a volume for the backend.

Key decision: the browser only talks to the Next.js site, which forwards `/api/*` to FastAPI. This keeps the login cookie same-origin and avoids CORS problems.

---

## Running the project

Requires Node.js 20+ and Python 3.12.

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API at http://127.0.0.1:8000, interactive docs at `/docs`. The first start creates `route53.db`, the demo user and a sample zone.

**Frontend** (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

**Settings (all optional locally)**

| Where    | Variable                      | Purpose                                                      |
| -------- | ----------------------------- | ------------------------------------------------------------ |
| Backend  | `DATABASE_URL`                | Database path, e.g. `sqlite:////data/route53.db` on a volume |
| Backend  | `SECRET_KEY`                  | Signs login tokens (required when `COOKIE_SECURE=1`)         |
| Backend  | `COOKIE_SECURE`               | `1` in production (https only)                               |
| Backend  | `DEMO_EMAIL`, `DEMO_PASSWORD` | Demo login created on first run                              |
| Frontend | `BACKEND_URL`                 | Where `/api/*` is forwarded (read at build time)             |

---

## Architecture

```
Browser -> Next.js (Vercel) -- /api/* proxy --> FastAPI (Railway, Docker) -> SQLite (volume at /data)
```

```
frontend/src/  app/ (pages)   components/ (shell, modals, forms)   lib/ (api client, auth, theme, data hooks)
backend/app/   main.py  config.py  db.py  models.py  schemas.py  validators.py  security.py  deps.py
               routers/  auth.py  zones.py  records.py
```

---

## Database schema

| Table          | Columns                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `users`        | `id`, `email` (unique), `hashed_password`                                                                            |
| `hosted_zones` | `id`, `name` (unique), `type` (public/private), `comment`, `created_at`                                              |
| `records`      | `id`, `zone_id` (FK, deleted with zone), `name`, `type`, `ttl`, `values` (JSON list), `routing_policy`, `created_at` |

One hosted zone has many records.

---

## API overview

All endpoints except `/auth/login` and `/health` need a logged-in session. Full docs at `/docs`.

| Method           | Path                              | Description                                           |
| ---------------- | --------------------------------- | ----------------------------------------------------- |
| POST             | `/auth/login`, `/auth/logout`     | Log in / out                                          |
| GET              | `/auth/me`                        | Current user                                          |
| GET, POST        | `/zones`                          | List (`search`, `type`, `page`, `page_size`) / create |
| GET, PUT, DELETE | `/zones/{id}`                     | Get / edit description / delete                       |
| GET, POST        | `/zones/{id}/records`             | List (`search`, `type`, `page`, `page_size`) / create |
| POST             | `/zones/{id}/records/batch`       | Create several, all or nothing                        |
| POST             | `/zones/{id}/records/bulk-delete` | Delete several (`{"ids": [...]}`)                     |
| GET, PUT, DELETE | `/zones/{id}/records/{record_id}` | Get / edit TTL and values / delete                    |
| GET              | `/health`                         | Health check                                          |

Lists return `{ items, total, page, page_size }`. Errors: `401` not logged in, `404` not found, `409` duplicate or CNAME conflict, `422` invalid input, `400` blocked action.
