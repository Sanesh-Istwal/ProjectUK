# ProjectUK

Interactive map and community stories pilot web application.

## Architecture

This project is a **modular monolith** consisting of:
- **`apps/web`**: Next.js frontend with MapLibre GL JS and community stories gallery.
- **`apps/api`**: Node.js + Express modular REST backend (`/api/v1/`).
- **`packages/shared`**: Shared constants, role definitions, and error codes.
- **`packages/api-client`**: OpenAPI specification (`openapi.json`) and typed API client.
- **`infra/docker-compose.yml`**: PostgreSQL + PostGIS container and local S3-compatible MinIO storage.

## Getting Started

### Prerequisites
1. **Node.js** (v18+ or v20+ recommended)
2. **Docker Desktop** (for PostgreSQL + PostGIS and MinIO)

### Setup & Run

1. Start database and storage infrastructure:
   ```bash
   cd infra
   docker-compose up -d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start API backend (runs on port 4000):
   ```bash
   cd apps/api
   npm run dev
   ```

4. Start Web frontend (runs on port 3000):
   ```bash
   cd apps/web
   npm run dev
   ```

5. Visit `http://localhost:3000` to view the frontend, and `http://localhost:4000/api/v1/health` for the API.

