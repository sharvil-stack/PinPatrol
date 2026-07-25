# PinPatrol

A full-stack civic incident-reporting platform. Citizens drop pins on a live map to report incidents; officers triage, verify, and investigate reports through a dedicated dashboard backed by AI-assisted tooling.

## Features

- **Role-based auth** — JWT issued as an `httpOnly`, `Secure`, `SameSite=Strict` cookie. Signup always creates a `CITIZEN`; `OFFICER` is granted manually, not self-selected.
- **Live incident map** — click-to-pin reporting, severity-colored markers, a toggleable density **heatmap**, and click-to-search for incidents within a configurable radius (spatial query backed by MySQL's `ST_Distance_Sphere`).
- **Real-time updates** — new reports broadcast to connected clients over WebSocket (STOMP/SockJS).
- **Verification pipeline** — every report starts `PENDING` and is only visible platform-wide once an officer marks it `VERIFIED` or `REJECTED`, mitigating spam/false reports.
- **Officer dashboard** — triage queue, category/status/severity breakdowns, and per-report AI tooling.
- **AI-assisted investigation**:
  - Automatic **duplicate detection** on report creation (geo + time proximity heuristic)
  - **Similar-incident detection** across historical reports (LLM-based)
  - **Case brief generation** — AI-written summary of a report and its related incidents
  - **Media description** — automatic captioning of uploaded images/video for triage context
- **Media uploads** — signed, direct-to-Cloudinary upload flow (the backend never proxies file bytes; it only issues a signed payload and later registers the resulting URL).

## Tech Stack

**Backend**
- Java 21, Spring Boot 4.1.0 (Jakarta namespace)
- Spring Security (stateless, cookie-based JWT)
- Spring Data JPA / Hibernate + MySQL
- Spring WebSocket (STOMP over SockJS)
- Cloudinary (media storage)
- OpenRouter / Gemini (AI features)

**Frontend**
- React 19 + Vite
- React Router v7
- Leaflet + `leaflet.heat` (map + heatmap)
- Tailwind CSS v4
- Axios, `@stomp/stompjs` + `sockjs-client`

## Project Structure

```
PinPatrol/
├── src/main/java/org/crime/pinpatrol/
│   ├── config/         # Security, WebSocket, Cloudinary config
│   ├── controller/      # REST controllers
│   ├── dto/              # Request/response records
│   ├── model/            # JPA entities
│   ├── repository/       # Spring Data repositories
│   ├── security/         # JWT util + auth filter
│   ├── service/          # AI + business logic services
│   └── util/              # Geo utilities, etc.
├── src/main/resources/
│   └── application.properties
└── frontend/
    └── src/
        ├── components/    # Reusable UI (auth, map, reports, dashboard, common)
        ├── context/        # AuthContext
        ├── pages/          # Landing, Login, Signup, LiveMap, Dashboard
        ├── services/       # API clients (auth, reports, dashboard, socket)
        └── utils/          # Shared styling/formatting helpers
```

## Getting Started

### Prerequisites
- Java 21
- Node.js (LTS) + npm
- MySQL 8

### Database Setup

```sql
CREATE DATABASE pinpatrol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pinpatrol_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON pinpatrol.* TO 'pinpatrol_user'@'localhost';
FLUSH PRIVILEGES;
```

The `reports` table uses a generated spatial `location` column (derived from `lat`/`lng`) with a `SPATIAL INDEX`, which powers the nearby-search feature. This column can't be expressed via JPA annotations and must be added manually after Hibernate creates the base tables:

```sql
ALTER TABLE reports
  ADD COLUMN location POINT AS (POINT(lng, lat)) STORED NOT NULL SRID 4326,
  ADD SPATIAL INDEX idx_location (location);
```

### Backend

Set the following environment variables (e.g. via your IDE's run configuration, or an EnvFile plugin):

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pinpatrol
DB_USER=pinpatrol_user
DB_PASSWORD=your-password

DDL_AUTO=update          # use `validate` once schema is stable / in production
SHOW_SQL=true

JWT_SECRET=<32+ char random string, e.g. `openssl rand -base64 32`>
JWT_EXPIRATION_MS=86400000

FRONTEND_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

Run the app from your IDE, or:

```bash
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` (pinned via `vite.config.js`; the backend's CORS config expects this exact origin).

## API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Creates a `CITIZEN` account, issues auth cookie |
| POST | `/api/auth/login` | Public | Issues auth cookie |
| POST | `/api/auth/logout` | Authenticated | Clears auth cookie |
| GET | `/api/auth/me` | Authenticated | Returns current user |
| GET | `/api/reports` | Authenticated | List all reports |
| GET | `/api/reports/{id}` | Authenticated | Get a single report |
| POST | `/api/reports` | Authenticated | Create a report (runs duplicate-detection heuristic) |
| GET | `/api/reports/nearby` | Authenticated | Reports within a radius of a point (`lat`, `lng`, `radiusKm`) |
| GET | `/api/reports/{id}/summary` | Authenticated | AI-generated case summary |
| POST | `/api/reports/{id}/related` | Authenticated | AI similar-incident detection; returns all linked reports |
| PATCH | `/api/reports/{id}/verify` | Officer | Approve/reject a pending report |
| PATCH | `/api/reports/{id}/status` | Officer | Update operational status (open/in-progress/resolved) |
| GET | `/api/media/signature` | Authenticated | Issues a signed Cloudinary upload payload (timestamp, signature, folder) |
| POST | `/api/reports/{id}/media` | Owner or Officer | Registers an uploaded Cloudinary URL against a report |
| POST | `/api/reports/{reportId}/media/{mediaId}/describe` | Owner or Officer | AI image/media description |
| GET | `/api/dashboard/stats` | Officer | Aggregate stats for the triage dashboard |

## Roadmap

- [ ] Deployment (Render: backend web service, frontend static site, managed MySQL)
- [ ] CI/CD via GitHub Actions
- [ ] Gray-out (rather than hide) pending reports on the public map

## License

MIT — update if a different license is preferred.
