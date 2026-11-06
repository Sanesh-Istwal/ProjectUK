1. Project Summary

A website with a separate frontend and backend, built as a pilot to validate the idea before investing further.

Features (v1):

User signup, login, and profile details
Interactive maps
Authenticated and authorized users can submit stories and photos, which the site publishes as a gallery (after moderation)

Planned later (NOT in v1):

Our own generative AI chatbot, which will draw on the site's stories and map data
2. Constraints and Expectations
Item	Value
Stage	Pilot, pre-deployment
Expected traffic	~700 users/day, ~15k users/month (estimate)
Realistic peak	Tens of simultaneous users, single-digit requests/sec
Language	JavaScript ecosystem for both frontend and backend (TypeScript recommended on top of JS for safety; confirm with the owner)
Main cost/risk areas	Image storage and bandwidth, map tile usage, moderation effort, security of login and uploads. Raw scale is NOT the constraint
3. Architecture Decision

Modular monolith backend + Next.js frontend, connected through a typed REST API (OpenAPI).

Reasoning:

Microservices add network, versioning, and DevOps complexity that this scale does not justify.
Each feature is an isolated module with clear boundaries, so any module can be extracted into its own service later if it needs independent scaling.
The backend is stateless, so scaling later means running more instances.
Diagram
Browser
  |
CDN (static assets + gallery images)
  |
Next.js frontend (MapLibre maps, gallery, forms)
  |
Backend API (modular monolith, Node.js)
  |-- auth / users / maps / content / media / notifications / (ai, later)
  |
  |-- PostgreSQL + PostGIS (data + geo; pgvector later for the AI bot)
  |-- Job queue + worker (image processing, emails) -- database-backed to start
  |-- Object storage (Cloudflare R2 or S3) <-- direct uploads via pre-signed URLs
4. Chosen Stack (Pilot)
Layer	Choice	Notes
Frontend	Next.js + TypeScript/JS	SSR for SEO
Backend	Node.js with NestJS	Modular structure fits the module plan; Fastify or Express is acceptable if simpler is preferred
Database	Managed PostgreSQL + PostGIS (Supabase, Neon, or RDS)	Automated backups on
ORM	Prisma or Drizzle	Confirm choice
Auth	Managed provider (Clerk, Supabase Auth, Auth0, or Cognito)	Avoid hand-rolling login/signup. If self-built: argon2/bcrypt, rate limits, email verification
Image storage	Cloudflare R2 (no egress fees) or S3	Pre-signed direct uploads
Maps	MapLibre GL JS + hosted tiles (MapTiler/Stadia) or self-hosted Protomaps	Check current pricing and free-tier limits
Jobs	pg-boss (Postgres-backed)	Move to SQS/RabbitMQ only if needed
Hosting	Render, Railway, Fly.io, or Cloud Run	Docker-based, push-to-deploy
Validation	Zod (or class-validator in NestJS)	Validate all input on the backend
Errors/monitoring	Sentry + uptime check	Free tiers are enough
CI/CD	GitHub Actions	Separate dev and prod environments

Deliberately skipped for the pilot: Kubernetes, microservices, API gateway, Redis (add only if measured slowdown), dedicated message broker, read replicas, multi-region, GraphQL, vector store (until the AI bot).

5. Backend Modules
Module	Responsibility
auth	signup, login, tokens/sessions, password reset, email verification, roles
users	profile details and preferences
maps	places/markers, geo queries (PostGIS), viewport-based fetching
content	stories and gallery items, submission, moderation, publishing
media	pre-signed upload URLs, upload completion, image variants
notifications	emails (verification, "your story was approved/rejected")
ai (later)	isolated module; reads content/maps via internal interfaces

Rule: modules talk to each other through defined interfaces or events, never by reaching into another module's database tables.

Suggested folder layout
repo/
  apps/
    web/                # Next.js frontend
    api/                # NestJS backend
      src/
        modules/
          auth/ users/ maps/ content/ media/ notifications/
        common/         # middleware, errors, utils
        config/
  packages/
    api-client/         # generated from OpenAPI (typed client for the frontend)
    shared/             # shared types/validation schemas
  infra/                # Dockerfiles, deploy config
  docs/
  project-checkpoint.md # this file
6. Security and Authorization
Authentication (who you are) and authorization (what you may do) are separate concerns.
RBAC roles: visitor, member, contributor (approved to post), moderator, admin.
Authorization is enforced on the backend for every endpoint, never only in the UI.
Short-lived access tokens plus refresh tokens in httpOnly cookies.
Rate limiting on login, signup, and upload endpoints.
Validate all input server-side regardless of frontend checks.
7. Stories and Gallery Design (the trickiest feature)
Direct-to-storage uploads: the frontend requests a pre-signed URL from the API, uploads straight to object storage, then notifies the API on completion. Photos never stream through the backend.
Async image processing (worker): generate thumbnails and resized WebP/AVIF variants, strip EXIF (it can leak uploader GPS location), validate the file. Serve via CDN.
Moderation workflow: status draft -> pending -> approved | rejected -> published. Only approved/published items are public.
Safety checks: validate file type by content (not extension), enforce size limits, consider malware scanning and an image-moderation API.
Privacy: let users choose location precision if a photo or story has a location.
Legal basics before public uploads: Terms of Service, ownership/licensing of uploaded content, takedown process.
8. Interactive Maps Design
MapLibre GL JS on the frontend.
PostGIS for "near me" and bounding-box queries.
Fetch only markers inside the current viewport; cluster when zoomed out; cache hot queries.
Watch tile-provider usage costs.
9. API Conventions
REST with an OpenAPI spec as the contract; generate a typed client for the frontend.
Versioned: /api/v1/...
One consistent error shape: { code, message, details }
Pagination on all list endpoints; idempotency keys on write endpoints where relevant.
Stateless backend (no in-memory session state).
10. Preparing for the AI Bot (later, do NOT build now)
Keep stories and map data clean and well-structured.
Keep the ai module isolated behind internal interfaces.
Later: pgvector inside the existing Postgres for retrieval, a streaming endpoint for responses, and per-user rate limits and usage caps (AI calls cost money).
11. Must-Haves Even for a Pilot
 Modular structure + OpenAPI contract
 Roles and moderation workflow
 Direct uploads, EXIF stripping, file validation, size limits
 Automated DB backups and one tested restore
 Sentry + uptime monitoring
 Rate limiting on auth and upload endpoints
 Terms of Service and takedown process before public uploads
 Separate dev and prod environments with CI/CD
12. Build Order and Current Status

Update the checkboxes as work completes. An AI continuing this project should start at the first unchecked item.

Phase 1: Foundation

[x] Confirm open decisions (Section 14)
[x] Create monorepo skeleton (apps/web, apps/api, packages/*)
[x] Docker setup and local dev environment (Postgres + PostGIS)
[x] CI pipeline (lint, test, build)
[x] OpenAPI generation and typed client wiring

Phase 2: Auth and roles

[x] Integrate auth provider (or build auth module)
[x] Signup, login, logout, password reset, email verification
[x] Roles and permission guards
[x] Profile endpoints and pages

Phase 3: Maps (read-only first)

[ ] PostGIS schema for places
[ ] Seed data
[ ] Viewport-based marker API
[ ] MapLibre frontend with clustering

Phase 4: Stories and gallery

[ ] Content schema and moderation statuses
[ ] Pre-signed upload flow
[ ] Image processing worker (variants, EXIF strip)
[ ] Submission UI for contributors
[ ] Moderator review queue
[ ] Public gallery and story pages

Phase 5: Hardening and launch

[ ] Rate limits, security review, backups tested
[ ] Monitoring and alerts
[ ] Legal pages
[ ] Production deploy

Phase 6 (later): AI bot

[ ] Not started. Do not begin until Phases 1-5 are stable.

Current status: Phase 2 (Auth and roles) completed in subproject `ProjectUK`. Next step: Phase 3 (Maps: PostGIS schema, seed data, viewport API, MapLibre clustering).

13. Decision Log
Decision	Reason
Modular monolith, not microservices	Pilot scale (~700 users/day); lower complexity; can extract modules later
JavaScript ecosystem for both frontend and backend	Owner's preference (single language)
Express for backend	Simpler and cleaner for pure JavaScript (no TypeScript decorator overhead)
Project scaffolding under `ProjectUK`	Subproject within workspace; easily refactorable/renamable
Lightweight S3-compatible storage (MinIO for dev)	Local, open-source, lightweight; smoothly transitions to Cloudflare R2
MapLibre GL + OpenStreetMap	Free, open source tiles for pilot; no upfront credit card/costs
Story locations optional	Stories and photos can be posted without mandatory GPS coordinates
Managed auth provider	Login/signup is security-sensitive; free tiers cover the pilot
Direct-to-storage uploads	Keeps backend light; scales easily
PostgreSQL + PostGIS	Relational data and geo queries in one store; pgvector available later
No Redis/queue broker/Kubernetes initially	Not needed at this scale; add on measured need
Moderation workflow from day one	Public user-generated content needs a safety gate
AI bot deferred	Owner wants it in a later stage
14. Open Questions (confirm before or during Phase 1)
Plain JavaScript or TypeScript (strongly recommended, still the JS ecosystem)?
Managed auth provider vs self-built auth? If managed, which one?
Hosting preference and budget ceiling?
Map tile provider (hosted vs self-hosted Protomaps)?
ORM choice (Prisma vs Drizzle)?
Do stories and photos always have a map location, or is it optional?
Who moderates content, and how are users promoted to contributor?
Target launch region (affects data-protection and legal requirements)?
15. Instructions for the Continuing AI
Treat this file as the source of truth. Do not re-litigate decisions in Section 13 unless the owner asks.
Prefer the simplest option that satisfies the pilot scale; do not introduce skipped technologies (Section 4) without a measured need.
Work on one phase at a time, starting from the first unchecked item in Section 12.
When you finish a task, tell the owner exactly which checkboxes to tick and any new decisions to add to Section 13, or output an updated copy of this file.
Ask the owner about unresolved items in Section 14 before building anything that depends on them.
Verify current pricing and free-tier limits of third-party services before recommending them, since these change often.