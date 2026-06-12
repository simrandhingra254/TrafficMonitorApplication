# FlowSight — AI-powered V2X Traffic Intelligence

An interactive web application that visualises traffic data through live,
filterable charts (**country-wise traffic** and **vehicle-type distribution**)
and an interactive congestion map. Built with a .NET 8 Web API, an Angular 17
front end, PostgreSQL, and real-time updates over SignalR.

---

## Features

- Two interactive charts (bar + pie/doughnut) powered by Chart.js, with KPI
  summary cards, a bar⇄line toggle, and active-filter chips.
- Server-side **filtering** by country, vehicle type, and **date range**.
- **Real-time updates**: new traffic events are pushed to every connected
  client over SignalR and the charts animate in immediately.
- **Live Traffic Map** (Leaflet) of Greater Vancouver: road segments coloured by
  congestion (green/amber/red), a **time-travel slider** (6am→12pm→6pm→10pm)
  that re-colours the map, **incident impact-radius** overlays, and a
  **border-crossing wait-time widget** (Peace Arch / Aldergrove).
- Clean, responsive, dark-themed UI.
- One-command **Docker Compose** stack (Postgres + API + front end).
- **CI** pipeline (GitHub Actions) that builds and tests both halves.
- Unit tests on both sides (xUnit + Jasmine/Karma).

---

## Architecture overview

```
┌──────────────┐    HTTPS / WebSocket    ┌───────────────────┐    EF Core    ┌────────────┐
│  Angular 17  │  ───────────────────▶   │   .NET 8 Web API  │  ─────────▶   │ PostgreSQL │
│  (Chart.js)  │   REST  /api/traffic    │  Controllers      │   Npgsql      │            │
│              │ ◀───────────────────    │  Service layer    │  ◀─────────   │            │
│  SignalR     │   /hubs/traffic push    │  SignalR hub      │               │            │
└──────────────┘                         └───────────────────┘               └────────────┘
```

- **Front end** requests aggregated data from `GET /api/traffic` and renders it.
- The **API** aggregates `TrafficRecord` rows in the database (all filtering and
  grouping happens in SQL so payloads stay small).
- When a new record is posted, the API persists it and **broadcasts** the
  refreshed dashboard through the SignalR hub.

A full systematic write-up (data model, API spec, scalability, testing,
deployment) lives in [`docs/FlowSight-Documentation.pdf`](docs/).

---

## Project layout

```
FlowSight/
├─ backend/
│  ├─ FlowSight.Api/      # .NET 8 Web API (models, EF Core, services, hub)
│  ├─ FlowSight.Tests/    # xUnit tests
│  └─ FlowSight.sln
├─ frontend/
│  └─ flowsight-web/      # Angular 17 app + Jasmine specs
├─ docs/                   # LaTeX source + compiled PDF
├─ .github/workflows/ci.yml
└─ docker-compose.yml
```

---

## Running with Docker (recommended)

Requires Docker + Docker Compose.

```bash
docker compose up --build
```

- Front end: <http://localhost:8081>
- API + Swagger: <http://localhost:5000/swagger>
- PostgreSQL: `localhost:5432` (db `flowsight`, user/pass `postgres`)

The API applies EF Core migrations and seeds the reference data automatically on
startup.

---

## Running locally (without Docker)

### 1. Database

Start a PostgreSQL 16 instance and ensure these credentials match
`backend/FlowSight.Api/appsettings.json` (or override the
`ConnectionStrings__Default` environment variable):

```
Host=localhost;Port=5432;Database=flowsight;Username=postgres;Password=postgres
```

### 2. Backend

```bash
cd backend
dotnet restore
dotnet run --project FlowSight.Api
# API on http://localhost:5000  (Swagger at /swagger)
```

Migrations run and seed data is inserted automatically at startup. To manage
migrations manually:

```bash
dotnet tool install --global dotnet-ef        # once
dotnet ef database update --project FlowSight.Api
```

### 3. Frontend

```bash
cd frontend/flowsight-web
npm install
npm start
# App on http://localhost:4200
```

---

## API reference

| Method | Route                  | Description                                              |
|--------|------------------------|----------------------------------------------------------|
| GET    | `/api/traffic`         | Aggregated dashboard data. Query: `countryId`, `vehicleTypeId`, `from`, `to`. |
| GET    | `/api/traffic/filters` | Available countries and vehicle types for the filters.   |
| POST   | `/api/traffic`         | Ingest a new traffic record; broadcasts a live update.   |
| GET    | `/api/map`             | Live-map data for an hour bucket (`?hour=6\|12\|18\|22`): road segments with congestion level, incidents, and border waits. |
| WS     | `/hubs/traffic`        | SignalR hub; emits `DashboardUpdated`.                    |

Example:

```bash
curl "http://localhost:5000/api/traffic?countryId=2&from=2026-06-01&to=2026-06-09"
```

---

## Running the tests

Backend:

```bash
cd backend
dotnet test
```

Frontend:

```bash
cd frontend/flowsight-web
npm run test
```

---

## Scalability (5 → 50 → 500 RPS)

- **5 RPS** — a single API instance and a single PostgreSQL instance are
  sufficient. Add indexes (already present) and connection pooling.
- **50 RPS** — run several **stateless** API replicas behind a load balancer,
  add a **Redis** response cache for the aggregation endpoint, tune EF Core
  connection pooling, and use a Redis **backplane** so SignalR works across
  replicas.
- **500 RPS** — auto-scale API pods (Kubernetes/HPA), add PostgreSQL **read
  replicas** and route reads to them, serve the Angular bundle from a **CDN**,
  pre-compute heavy aggregates via **materialized views**, and move ingestion
  behind a **message queue** to smooth write spikes.

See the PDF in `docs/` for the detailed version with diagrams.

---

## Notes

The code is intentionally written in clean, conventional style so it is easy to
read, extend, and reason about.
