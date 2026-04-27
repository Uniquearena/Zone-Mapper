# Deadzone Tracker

A community-powered map for reporting and exploring signal dead zones (cellular, WiFi, GPS, satellite). Users can drop pins on a world map, browse a searchable intel log, and view aggregate analytics.

## Architecture

- **Monorepo**: pnpm workspaces (see `pnpm-workspace.yaml`)
- **API server**: `artifacts/api-server` — Express 5 + Drizzle ORM + PostgreSQL
- **Web app**: `artifacts/deadzone-tracker` — React + Vite + Wouter + React Query + shadcn/ui + Leaflet (preview path `/`)
- **Shared libs**:
  - `lib/api-spec` — OpenAPI 3 spec, source of truth for routes/types
  - `lib/api-zod` — generated Zod schemas
  - `lib/api-client-react` — generated React Query hooks
  - `lib/db` — Drizzle schema + migrations

## Data model

`deadzones` table (see `lib/db/src/schema/deadzones.ts`):
- `type`: cellular | wifi | gps | satellite
- `severity`: low | medium | high | total
- location (lat/lng), title, description, carrier, address, confirmations counter
- timestamps, optional reporter handle

## API endpoints

All under `/api/deadzones` plus `/api/stats`:
- CRUD (list/get/create/update/delete) with type/severity/bbox filters
- `POST /:id/confirm` — increment confirmation counter
- `GET /recent?limit=` — recent reports for live feed
- `GET /stats/summary` — totals, severity breakdown, type breakdown
- `GET /stats/hotspots` — top reporting cities
- `GET /stats/carriers` — top carriers by report count

## Frontend pages

- `/` — Leaflet map with type/severity filters, recent activity sidebar, click-to-report FAB
- `/reports` — searchable, filterable signal intel log table
- `/reports/:id` — detail view with mini-map and confirm button
- `/stats` — Network Intelligence dashboard with bar/pie charts (Recharts)
- `/about` — project overview

## Theme

Dark technical OSINT aesthetic, cyan accent (`hsl(188 86% 43%)`), Space Mono / Space Grotesk fonts, sharp corners. Map uses Carto dark tiles.

## Workflows

- `artifacts/api-server: API Server`
- `artifacts/deadzone-tracker: web`
- `artifacts/mockup-sandbox: Component Preview Server`

Database has been seeded with 30 realistic reports across NYC, SF, Chicago, Seattle, national parks, London, Tokyo, and Sydney.
