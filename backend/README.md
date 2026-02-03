# FarmTrak Backend (Node.js + Express + PostgreSQL)

## Setup

1) Create a `.env` file in `backend/` using `backend/env.example` as your template.

2) Create the database + table:

- Option A (recommended): run the schema script:
  - `npm run db:schema`
- Option B: manually run `backend/db/schema.sql` in your Postgres client.

## Run

- Dev: `npm run dev`
- Prod: `npm start`

## Environment variables

- Postgres (pick one):
  - `DATABASE_URL=postgres://user:pass@host:port/dbname`
  - OR: `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASS`, `DB_PORT`

## API

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
  - body: `{ "name": "...", "email": "...", "password": "...", "role": "admin|manager|worker" }` (role defaults to `worker` if omitted)
  - returns: `{ "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "worker", "created_at": "..." } }`

- `POST /api/auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - returns: `{ "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "worker" } }`

- `GET /api/auth/me`
  - header: `Authorization: Bearer <token>`
  - returns: `{ "user": { "id": 1, "name": "...", "email": "...", "role": "worker", "created_at": "..." } }`

