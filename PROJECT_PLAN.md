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
- Prisma enum unsupported on `sqlserver` → use **String fields + TS union types** (`Role`, `ItemStatus`, `CategoryType`, `TransactionType`, `ItemType`).
- `ItemType` union (12 device kinds) lives in `lib/types.ts` as `ITEM_TYPES` — single source of truth for master-data Type dropdown + combobox. Add new kinds there only (no DB migration needed; `ItemModel.type` is a free String column).
- `CategoryType` = `FA | NCA | GENERAL` (renamed from `OTHER` in Phase 7).
- Reserved-word models renamed: `User` → `SystemUser`, `Transaction` → `ItemTxn`.
- Always `binaryTargets = ["native", "windows"]` for cross-OS deploy.
- `lib/db.ts` & `auth.ts` import `"server-only"` (prevent mssql/tedious leaking to client/edge).
- Admin seed: **ADM001 / `Admin@12345`** (ADMIN) — change before production.

---

## 2. Data Model (SQL Server)

| Model | Key fields | Notes |
|---|---|---|
| `SystemUser` | employeeNumber (PK string), name, passwordHash, role, isDeleted | soft-delete |
| `ItemModel` | id, type, brand, name, category, isDeleted | catalog of asset types (type = kind of device, brand + name = model) |
| `Item` | serialNumber (PK), modelId, status, poNumber, location, dateReceived, remarks, hostname, isDeleted | one physical asset (hostname = per-device, PC/Laptop/Tablet at release, else N/A) |
| `ItemTxn` | id, itemId, type, operatorId, assigneeEmpNumber, assigneeName, assigneeDept, gid, email, returningPicName, returnReason, remarks, date | movement log (gid/email captured at release AND return) |
| `AuditLog` | id, userId, action, details (JSON string), timestamp | every create/role/delete/op |

Status union: `AVAILABLE | DEPLOYED | RETURNED_KEEP | IN_REPAIR | DISPOSED`
(Display labels: `DEPLOYED`→**RELEASED**, `DISPOSED`→**PLAN DISPOSE** via `statusLabel()` in `lib/types.ts`; DB values unchanged.)
Category union: `FA | NCA | GENERAL`  (was `OTHER` → renamed `GENERAL`)
ItemType union: `PC | Laptop | Tablet | Mouse | Keyboard | Monitor | Projector | Camera | CCTV | Printer | Kensington | Adaptor` (dropdown in master-data)
Transaction union: `RECEIVE | RELEASE | RETURN`
Role union: `ADMIN | MANAGER | OPERATOR`

> ItemModel field `type` added in Phase 7 (DB pushed). `name` holds the model
> (e.g. "1920g"), `brand` the vendor (e.g. "Honeywell"), `type` the device kind
> (e.g. "Scanner"). Brand & Model are auto-uppercased on create.

**Race-condition guard:** all state-changing flows run inside
`prisma.$transaction(async (tx) => { ... })` (interactive) — e.g. receive sets
`DEPLOYED`, release sets `AVAILABLE`→`DEPLOYED` (also accepts `RETURNED_KEEP` re-deploy),
return sets `AVAILABLE`/`DISPOSED`, with
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

### ✅ Phase 7 — Receive UX overhaul + Master-data model enhancements
- [x] **Master-data delete modal**: `master-data-table.tsx` client wrapper, persistent modal (lifted out of row `.map`), 4 states (confirm/blocked/error/success) with keyed `animate-fade-in` crossfade + checklist `check-pop`/`check-draw` (~1s, slow enough to see). Guard: block delete if model still has active items.
- [x] **Receive Batch Input tab**: `receive-tabs.tsx` sliding-pill (absolute `bg-indigo-600` + `translateX`, cubic-bezier overshoot). `batch-receive-form.tsx` textarea (1 serial/line) + separate PO Number + disabled Location (IT Store). `receiveBatchAction` loops `receiveItem` per serial, per-item `try/catch` (no full rollback); per-item result table (✓/✗ + reason). Runtime-verified 50/52.
- [x] **ModelCombobox** (`components/model-combobox.tsx`, 0-dep): searchable (type+name+brand), grouped by category, keyboard nav (↑↓/Enter/Esc), outside-click close. Used by single + batch receive.
- [x] **Location disabled** in both receive forms (value IT Store, grayed, hidden input submits it).
- [x] **PO Number** separated field (not piped in serial line) + prefilled `PTCAP__` (single `defaultValue`, batch `useState`).
- [x] **ItemModel.type field** (DB pushed via `prisma db push`): `lib/types.ts` `ITEM_TYPES` (12-value union, single source of truth) + `CategoryType` now `FA|NCA|GENERAL`; `itemModelSchema` + `type`; `create-model-form.tsx` Type dropdown; master-data table shows Type+Model columns; combobox row = `type · brand name`.
- [x] **Category `OTHER` → `GENERAL`**: code (`types`, `validation`, form, schema) + DB data migrated (1 row). Combobox `CATEGORIES` updated so GENERAL models appear/searchable.
- [x] **Brand & Model auto-uppercase** on master-data create (`onChange` upper-cases DOM value).
- [x] Batch form width matched to single (`max-w-lg`).
- **Commits:** `cf69c4f` (features) · `62869b7` (UI polish: width + PO default)

### ✅ UI Tune-up 3 — Release/Return detail panels + return disposition UX
- [x] **Date display in ITEM DETAILS**: release shows `Received` (dateReceived) + success `Released` (txn date); return shows `Deployed` (RELEASE txn date) + success `Returned` (txn date). Format `Day, DD-Month-YYYY` via `formatDate` helper. `lookup`/`lookup-deployed` routes return `receivedAt`/`releasedAt`. `releaseAction` returns `releasedAt`, `returnAction` returns `txnAt`.
- [x] **Empty-state illustration**: `public/illustrations/list-items.png` shown centered in ITEM DETAILS when SN empty (`min-h-[18rem]`).
- [x] **Available Items table** (`app/release/available-items-table.tsx`, server component): title "Available Items" / "Items ready to Release"; columns Serial Number · Type · Brand · Model · Category · Status (emerald badge); `max-h-80 overflow-y-auto` scroll + sticky header; `orderBy dateReceived asc` (oldest first). `releaseAction` revalidates `/release`.
- [x] **Section searchable dropdown** (`components/section-combobox.tsx`, 0-dep): hardcoded `SECTIONS` (26 values, editable in file) + realtime filter + keyboard nav + outside-click; replaces "Department" label → "Section" on release form (Assignee Emp# + Name kept).
- [x] **Return redesign**: Returning PIC → 2 fields (Assignee Emp# uppercase + Assignee Name titleCase). **3 selectable circle dispositions** (radio): Returned Keep (blue) → `RETURNED_KEEP`, Repair (amber) → `IN_REPAIR`, Dispose (rose) → `DISPOSED`. Each circle: icon + label + sub-text + colored border/bg, **neon-breathing glow** (`@keyframes neon-breath` in globals.css) + soft box-shadow glow on selected card; label text follows tone. `returnSchema` + `disposition: enum(KEEP/REPAIR/DISPOSE)`; `returnItem` sets status from disposition; `returningPicName` = `Emp — Name` injected before `safeParse` (fixed "received undefined" bug). Success panel `Status` badge uses tone (blue/amber/rose) + glow via `Row badgeTone`. Right panel title → "Returned Item Details". Fixed success-status reset bug (DISPOSE was showing RETURNED_KEEP) via `returnedDisposition` snapshot.
- **Commit:** `48c3da1`

### ✅ UI Tune-up 4 — PC Ledger + Hostname/GID/Email capture
- [x] **DB migrate** (no `db push`, preserve data): `Item.hostname NVARCHAR(200) NOT NULL DEFAULT 'N/A'`, `ItemTxn.gid NVARCHAR(100) NULL`, `ItemTxn.email NVARCHAR(200) NULL` (ALTER + backfill 19 items).
- [x] `lib/types.ts`: `HOSTNAME_TYPES = ["PC","Laptop","Tablet"]` (single source of truth).
- [x] **Release**: GID + Email wajib **semua** type; Hostname wajib hanya PC/Laptop/Tablet (else auto "N/A"). `releaseItem` enforces + persists gid/email/hostname ke txn+item.
- [x] **PC Ledger** (`/pc-ledger`, sidebar link): 12 kolom (Emp# · PIC · GID · Email · Hostname · SN · Type · Brand · Model · Section · Remarks · Status), search box, status badges, sort by Section, AVAILABLE → "Unassigned"/"—". `HOSTNAME_TYPES` scope.
- [x] **Export Excel** (`/api/pc-ledger/export`, exceljs): bold header + frozen row 1 + auto-width → `pc-ledger-YYYY-MM-DD.xlsx`. (Added `exceljs` dep; `xlsx` still used by reports.)
- [x] `ItemModel.name` → `model` rename (DB `sp_rename` + 17 files) — done earlier (`bba108e`).
- [x] **Receive hardening**: Serial auto-UPPERCASE (single + batch); PO `PTCAP__` prefix **locked** (Backspace/Delete/paste blocked inside prefix) but user can append PO number after it (single + batch).
- [x] **Release form**: Hostname auto-UPPERCASE; success panel combines Type/Brand/Model → one "Item TYPE BRAND MODEL" row (uppercased); Hostname + Assignee Emp# + Assignee Name + Section shown from submitted values (snapshot kept, cleared on new serial). Received/Released rows below Section.
- **Commits:** `bba108e` (rename) · `9146b62` (ledger+hostname) · `3cd4d74` (SN/PO/hostname/ui) · `fb371e0` (PO lock) · `6b61e32` (success snapshot) · `394b4be` (reorder) · `b7fe396` (section+dates)

### ✅ UI Tune-up 5 — Return detail + RETURNED_KEEP re-deploy (Opsi A) + status relabel
- [x] **Return form**: Returning PIC → Emp# + Name + **GID** + **Email** (all required, persist to RETURN txn) + **Section** combobox (persist `assigneeDept`). GID/Email auto-upper/email; spacing `mt-4` between Name→GID/Email and GID/Email→Section.
- [x] **Returned Item Details** success panel: Item = TYPE BRAND MODEL (1 row, uppercase) → Serial → Location → Assignee → **Returned by** (`EMP — NAME — SECTION`, Section merged in, no separate row) → Deployed → Returned → Status. PIC snapshot kept for display (cleared on new serial).
- [x] **Auto-fill Section**: on serial lookup, Section prefills from `assigneeDept` of latest RELEASE txn (`lookup-deployed` already returns it) — user need not re-select.
- [x] **Opsi A (re-deploy RETURNED_KEEP)**: lookup route accepts `AVAILABLE` **or** `RETURNED_KEEP` for release (was AVAILABLE-only, returned 409). `Available Items` table includes `RETURNED_KEEP` with **blue badge** (vs AVAILABLE emerald); sorted **AVAILABLE first, then RETURNED_KEEP**. Re-release requires GID/Email/Hostname again (can differ).
- [x] **Status relabel (display + DB)**: `DEPLOYED`→`RELEASED`, `DISPOSED`→`PLAN_DISPOSE` (DB values changed via UPDATE; union + `ITEM_STATUSES` + `statusLabel()` in `lib/types.ts`). Display: "RELEASED" / "PLAN DISPOSE". All badges, dashboard cards/charts, reports filter, exports synced.
- [x] **Smooth transition**: right panel (release + return) content keyed by serial/status + `animate-panel-in` (fade + slide-up 0.32s) — no abrupt pop-in on lookup/submit.
- **Commits:** `014f5fc` · `42f697b` · `7fee01d` · `92007e6` · `7c9ed7f` · `b09101e` · `7ab2cc0` (relabel UI) · `585b3df` (relabel DB) · `711cbdf` (auto-fill section) · `a8cdb6a` (returned-by merge) · `652f36a` (panel-in)

### ✅ UI Tune-up 6 — Release hostname BAL prefix
- [x] **Hostname locked prefix `BAL`** on release (PC/Laptop/Tablet only): controlled input, prefix undeletable (Backspace/Delete/paste blocked inside prefix), user appends after it; resets to `BAL` on new serial. Mirrors PO `PTCAP__` behaviour on receive.
- **Commit:** `7124316`

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
- [x] Clean test data in `db_itInventory` (all rows DELETE; SystemUser preserved incl. ADM001) — done via sqlcmd, ready for clean UI input.
- [x] `SS/` (screenshots) added to `.gitignore` (commit `1d80143`).

---

## 5. UI/UX Design System (applied)
- **Layout:** fixed left sidebar (role-based nav) + topbar (centered global search + theme toggle + avatar dropdown).
- **Font:** Inter (via `next/font`).
- **Palette:** indigo-600 primary · emerald = AVAILABLE (badge + soft glow) · blue = RETURNED_KEEP (badge) / RELEASED context · amber = IN_REPAIR (disposition) · rose = PLAN_DISPOSE (disposition) · slate = neutral. Return disposition circles: neon-breathing glow + soft box-shadow on selected; label/border/badge follow tone.
- **Cards:** `rounded-2xl` + subtle shadow + `ring-1`.
- **Micro-animations:** fade-in / slide-up on load, slide-up toast, row/button hover, `panel-in` (fade + slide-up 0.32s) on release/return detail panel keyed by serial, check-pop/check-draw on success.
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
