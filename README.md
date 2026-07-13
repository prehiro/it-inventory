# IT Inventory Management System

Internal IT asset/inventory management web app for 5–10 users. Track laptops,
monitors, and other devices through their full lifecycle — **procurement →
deployment → return → repair/disposal** — with a complete movement audit trail
and role-based access control.

## Features

- **Receive** — single + batch intake, searchable model picker, auto IT Store location
- **Release** — scan a serial to preview item details, assign to an employee (section dropdown)
- **Return** — preview deployed item, pick disposition: **Keep** (available again) / **Repair** / **Dispose**
- **Master Data** — device model catalog (type / brand / model / category) with guarded delete
- **Dashboard** — status charts, recent activity, low-stock alerts
- **Reports** — filter by type/date, export to Excel & PDF
- **User Management** — admin CRUD with roles (ADMIN / MANAGER / OPERATOR)
- **Item lookup** — full movement history per serial
- **Dark mode** + responsive layout

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript (strict) |
| UI | Tailwind CSS v4 + Inter |
| Database | SQL Server (MSSQL) via Prisma 7 + `@prisma/adapter-mssql` |
| Auth | Auth.js v5 (Credentials + bcrypt, JWT session) |
| Charts | Recharts |
| Export | xlsx (Excel) + jsPDF (PDF) |
| Validation | Zod |

## Status Lifecycle

`AVAILABLE → DEPLOYED → RETURNED_KEEP | IN_REPAIR | DISPOSED`

Every state change is recorded as an `ItemTxn` (RECEIVE / RELEASE / RETURN),
giving a full audit trail per asset.

## Getting Started (dev)

```bash
npm install
npm run dev        # http://localhost:3200
npx tsx scripts/seed-admin.ts   # seed admin if needed
```

**Login:** `ADM001` / `Admin@12345` (change before production)

> Database runs in a local Docker `mssql2022` container. See `PROJECT_PLAN.md`
> for the full architecture, data model, phase history, and Windows deployment notes.

## Project Layout

```
app/            # routes: dashboard, receive, release, return, master-data, reports, admin, item
components/     # shared UI (comboboxes, status badge, charts, nav)
lib/            # DAL (inventory.ts), validation (zod), db client, auth
prisma/         # schema (String "enums" + renamed models — sqlserver limitation)
public/         # static assets (illustrations)
```

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the complete implementation plan.
