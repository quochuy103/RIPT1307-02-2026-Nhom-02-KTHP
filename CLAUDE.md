# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cutie Cuts** — barbershop booking system with e-commerce. Two separate apps:

- `backend/cutie-cuts-app/` — Spring Boot 3 API (Java 17)
- `frontend/` — React + Vite SPA

## Commands

### Backend (Java 17 + Spring Boot 3)

```bash
cd backend/cutie-cuts-app

# Run (without Docker)
./mvnw spring-boot:run

# Build
./mvnw package

# Run tests
./mvnw test
```

**Docker:**
```bash
docker compose up --build -d  # Starts backend + PostgreSQL (port 5433)
docker compose down -v       # Stop and remove volumes
```

**Environment variables:** `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT=8081`, `JWT_SECRET`

### Frontend (React + Vite + shadcn/ui + Tailwind)

```bash
cd frontend

npm run dev          # Start dev server
npm run build       # Production build
npm run lint        # ESLint
npm run test        # Vitest unit tests
npm run test:watch  # Vitest watch mode
```

**Google OAuth:** Set `VITE_GOOGLE_CLIENT_ID` in `.env`

## Architecture

### Backend — Spring Boot 3 layered structure

```
src/main/java/com/cutie_cuts_app/example/cutie_cuts_app/
├── config/          # DataInitializer, OpenApiConfig, SecurityConfig
├── controller/      # REST endpoints (Auth, Barber, Booking, Order, Product, etc.)
├── dto/             # Request/Response DTOs (auth/, barber/, domain/, product/, service/)
├── entity/          # JPA entities (User, Barber, Booking, Product, ShopOrder, etc.)
├── repository/      # Spring Data JPA repositories
├── security/        # JWT filter, AuthEntryPoint
└── service/         # Business logic layer
```

**Auth:** JWT + Google OAuth. Public endpoints: `/auth/**`, `/user/register`, Swagger UI.

**DB:** PostgreSQL. Hibernate auto-creates tables (`spring.jpa.hibernate.ddl-auto=update`). `schema.sql` runs on startup for safe column additions.

### Frontend — React SPA with shadcn/ui + Tailwind

```
src/
├── components/
│   ├── admin/        # AdminLayout, DataTable, FormModal, StatsCard, AdminSidebar/Topbar
│   └── ui/           # shadcn/ui components (40+ components)
├── context/          # AuthContext, CartContext
├── hooks/            # Custom React hooks
├── lib/              # API client (axios), utils (cn, formatters)
├── pages/            # Route pages (Index, Booking, Shop, Admin/*, etc.)
└── i18n/             # i18next translations
```

**State:** React Query (server state), React Context (auth + cart), component state (UI).

**Admin routes:** `/admin/*` — separate `AdminLayout` without Navbar/Footer.

**Validation:** React Hook Form + Zod resolvers on all forms.

## Key Patterns

- **DTOs** for API request/response — never expose entities directly
- **Repository pattern** — controllers call service layer, services call repositories
- **JWT in Authorization header** — `Bearer <token>` on protected routes
- **Soft delete** on users — `deletedAt` column
- **RBAC** — role-based endpoint protection in SecurityConfig

## Database

PostgreSQL 16+. Docker exposes on `localhost:5433` to avoid local Postgres conflict.

**pgAdmin:** `localhost:5433`, database `haircut_db`, user `postgres`, pass `postgres`

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **cutie-cuts-app** (2847 symbols, 7050 relationships, 239 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/cutie-cuts-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/cutie-cuts-app/clusters` | All functional areas |
| `gitnexus://repo/cutie-cuts-app/processes` | All execution flows |
| `gitnexus://repo/cutie-cuts-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
