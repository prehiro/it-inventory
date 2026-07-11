# IT Inventory Management System — Project Plan

> Internal IT asset/inventory management web app for 5–10 users.
> Track laptops/monitors/etc. from procurement → deployment → repair → disposal, with full movement audit trail and role-based access control.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.10** (App Router) | `middleware.ts` deprecated → use `proxy.ts` with named `proxy` export |
| Language | TypeScript (strict) | target ES2021 |
| UI | **Tailwind CSS v4** + **Inter** font | design system in §5 |
| DB | **SQL Server** (MSSQL) | dev on Debian Docker `mssql2022` @ `192.168.4.3:1433`; deploy to Windows Server local MSSQL |
| ORM | **Prisma 7** + `@prisma/adapter-mssql` | no `url` in schema — adapter + connection string; `server-only` in `lib/db.ts` |
| Auth | **Auth.js v5** (`next-auth@beta` 5.0.0-beta.31) | Credentials + bcryptjs, **JWT session strategy** (cookie) |
| Charts | recharts 3.9.2 | dashboard donut + bar |
| Export | xlsx 0.18.5 (Excel) + jspdf 4.2.1 (PDF) | server actions return base64 |
| Validation | zod 4.4.3 | union types for "enums" |
| Theme | next-themes 0.4.6 | `class` strategy, dark mode |

### Critical environment facts
- **Node 22.23.1** must stay (global `node` symlink is Hermes Agent's bundled node — do NOT upgrade to 24 globally).
- MSSQL adapter does **NOT** URL-decode the password → in `.env` the `@` stays **literal** (`%40` breaks login).
- Prisma enum unsupported on `sqlserver` → use **String fields + TS union types** (`Role`, `ItemStatus`, `CategoryType`, `TransactionType`).
- Reserved-word models renamed: `User` → `SystemUser`, `Transaction` → `ItemTxn`.
- Always `binaryTargets = ["native", "windows"]` for cross-OS deploy.
- `lib/db.ts` & `auth.ts` import `"server-only"` (prevent mssql/tedious leaking to client/edge).
- Admin seed: **ADM001 / `Admin@12345`** (ADMIN) — change before production.

---

## 2. Data Model (SQL Server)

| Model | Key fields | Notes |
|---|---|---|
| `SystemUser` | employeeNumber (PK string), name, passwordHash, role, isDeleted | soft-delete |
| `ItemModel` | id, brand, name, category, defaultLocation | catalog of asset types |
| `Item` | serialNumber (PK), modelId, status, poNumber, location, acquiredAt | one physical asset |
| `ItemTxn` | id, itemSerial, type, operatorId, assigneeName, returningPicName, remarks, date | movement log |
| `AuditLog` | id, userId, action, details (JSON string), createdAt | every create/role/delete/op |

Status union: `AVAILABLE | DEPLOYED | IN_REPAIR | DISPOSED`
Category union: `LAPTOP | MONITOR | PRINTER | OTHER`
Transaction union: `RECEIVED | RELEASED | RETURNED`
Role union: `ADMIN | MANAGER | OPERATOR`

**Race-condition guard:** all state-changing flows run inside
`prisma.$transaction(async (tx) => { ... })` (interactive) — e.g. receive sets
`DEPLOYED`, release sets `AVAILABLE`, return sets `AVAILABLE`/`DISPOSED`, with
a double-action guard so the same serial can't be double-released.

---

## 3. Phases & Status

### ✅ Phase 0 — Scaffold + MSSQL connect
- [x] Next.js 16 app scaffold (`create-next-app`, TS + Tailwind v4)
- [x] `prisma init --datasource-provider sqlserver`
- [x] Schema written (String enums + renamed models)
- [x] `@prisma/adapter-mssql` + `mssql` installed
- [x] `prisma.config.ts` with adapter; `lib/db.ts` singleton (`server-only`)
- [x] `.env` DATABASE_URL (literal `@` password) + AUTH_SECRET
- [x] `prisma db push` → DB `db_itInventory` created & synced
- [x] `tsc` + `next build` clean
- **Commit:** `f5c198a`

### ✅ Phase 1 — Auth.js v5 + RBAC
- [x] `auth.ts`: Credentials provider + bcryptjs verify + JWT callbacks
- [x] `lib/auth-utils.ts`: `requireAuth()` / `requireRole()`
- [x] `proxy.ts` (edge-safe): decode JWT, protect routes, role-based redirect
- [x] `types/next-auth.d.ts`: augment User/Session with `role`
- [x] Login page (client `signIn`)
- [x] `scripts/seed-admin.ts`: seed ADM001
- [x] Login → dashboard 200, session cookie works
- **Commit:** `56c8bd4`

### ✅ Phase 2 — Inventory DAL + server actions + RBAC pages
- [x] `lib/inventory.ts`: `receiveItem` / `releaseItem` / `returnItem` with `$transaction` + race guard
- [x] `lib/validation.ts`: zod schemas (itemModel, receive, release, return)
- [x] `app/actions/inventory.ts`: server actions (RBAC + zod)
- [x] `app/actions/master-data.ts`: ADMIN CRUD ItemModel
- [x] `app/api/dashboard/route.ts`: metrics + recent activity
- [x] Pages: dashboard `/`, master-data (ADMIN), admin, reports
- [x] Runtime-verified: receive→release→return flow + double-release rejected
- **Commit:** `3bc4fd9`

### ✅ Phase 3 — Operation UIs
- [x] `app/receive`, `app/release`, `app/return` pages + forms (`useActionState` + Toast)
- [x] Sidebar nav entries added
- [x] Runtime-verified full flow (SN-P3-FLOW RETURNED_KEEP, 3 txns)
- **Commit:** `b569f3b`

### ✅ Phase 4 — Dashboard charts, item search, report filters, export
- [x] `components/dashboard-charts.tsx`: recharts donut (by category) + bar (by dept)
- [x] `app/page.tsx`: charts + low-stock list + recent activity
- [x] `app/item/page.tsx`: item detail by `?serial=`
- [x] `app/reports/page.tsx` + `reports-filter.tsx`: filter by type/date + Excel/PDF export
- [x] `app/actions/export.ts`: `exportExcelAction` / `exportPdfAction` (base64)
- [x] Admin audit trail view
- [x] Runtime-verified: Excel (24 KB) + PDF generated
- **Commit:** `492ff60`

### ✅ Phase 5 — User management UI
- [x] `app/actions/users.ts`: `createUserAction` (bcryptjs hash + role + audit), `updateUserRoleAction`, `deleteUserAction` (soft delete)
- [x] `app/admin/create-user-form.tsx`: client `useActionState` form
- [x] `app/admin/user-controls.tsx`: inline `RoleSelect` + `DeleteUserButton`
- [x] `app/admin/page.tsx`: user table + forms + audit trail
- [x] Runtime-verified: create EMP010, role→MANAGER, soft-delete
- **Commit:** `a111a83`

### ✅ UI Tune-up 1 — Recent Activity + metric cards
- [x] `lib/audit-format.tsx`: audit action → `{icon, label, tone, summary}` (replaces raw JSON `{"employeeNumber":"MGR001",...}`)
- [x] `app/recent-activity.tsx`: icon + colored label rows
- [x] `app/admin/page.tsx`: Audit Trail uses same aesthetic format
- [x] `app/page.tsx`: 3-col layout (charts left `col-span-2`, Recent Activity right + `sticky`)
- [x] `app/page.tsx`: metric cards get professional line-icons (cube/check/arrow/wrench/trash/tag)
- **Commit:** `017fca3`

### ✅ UI Tune-up 2 — Dark mode + topbar + logout
- [x] `next-themes` + `components/theme-provider.tsx` (`class` strategy)
- [x] `dark:` variants across all pages/components (sidebar, topbar, cards, tables, forms, login, item, admin, reports, master-data, charts, toast, page-header)
- [x] `app/globals.css`: dark base, `custom-variant dark`, nav-link-active, fade/slide animations
- [x] `components/topbar.tsx`: avatar click → dropdown; **search bar centered** (`mx-auto`); theme toggle button
- [x] **Logout confirm modal**: centered, `fixed inset-0` backdrop-blur over full viewport (not just header); "Are you sure you want to log out?"
- [x] **Logout bug fixed**: was showing `Cannot GET /login` → now `signOut({redirect:false})` + `router.push("/login")`; verified `/` → 307 to `/login` after signout
- [x] Login page reverted to default slate bg (starfield experiment removed)
- **Commit:** `686bd64`

---

## 4. Pending / Next

### ⬜ Phase 6 — Windows Server Deployment (AWAITING YOUR CONFIRMATION — not started)
Plan:
1. Add `output: "standalone"` to `next.config.ts` (already safe to add on Debian).
2. Build standalone on Windows (Node 24 LTS): `npm run build`, copy `.next/standalone` + `.next/static` + `public` + `.env.production`.
3. DB: `CREATE DATABASE db_itInventory` on Windows MSSQL (or restore `.bak` from Debian) + `prisma db push`.
4. Run via **NSSM**: `nssm install ItInventory "node.exe" "server.js"`, set env vars.
5. `.env.production`: `DATABASE_URL` → `localhost` + Windows MSSQL password.

> Note: real deploy needs access to the Windows box (copy files, run NSSM). Prep that can be done on Debian: `output:standalone`, build verification, `deploy/` folder with `.env.production` template + `nssm-install.bat` + README.

### ⬜ Housekeeping (optional)
- [ ] Change admin password (ADM001) before production.
- [ ] Clean test data in `db_itInventory` (SN-TEST-001, ViaActionModel, SN-P3-FLOW, EMP010) — optional.
- [ ] Add `SS/` (screenshots) to `.gitignore` so they never get committed.

---

## 5. UI/UX Design System (applied)
- **Layout:** fixed left sidebar (role-based nav) + topbar (centered global search + theme toggle + avatar dropdown).
- **Font:** Inter (via `next/font`).
- **Palette:** indigo-600 primary · emerald = AVAILABLE · amber = IN_REPAIR · rose = DISPOSED · slate = neutral.
- **Cards:** `rounded-2xl` + subtle shadow + `ring-1`.
- **Micro-animations:** fade-in on load, slide-up toast, row/button hover.
- **Dark mode:** full `dark:` support, `class` strategy via next-themes.
- **StatusBadge:** colored pill per status.
- **Audit formatting:** human-readable labels + icons (no raw JSON shown to user).

---

## 6. How to Run (dev)
```bash
npm install
# .env already present with dev DATABASE_URL + AUTH_SECRET
npm run dev        # http://localhost:3000 (or 3200 if taken)
# seed admin:
npx tsx scripts/seed-admin.ts
```
Login: ADM001 / `Admin@12345`

## 7. Verification convention used
Each phase verified with: `npx tsc --noEmit` (clean) + `npm run build` (passes) +
runtime smoke test (login → protected route 200, or temp API route exercising
server actions / DAL). Temp test routes deleted after verification.
