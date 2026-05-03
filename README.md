# karta-challenge-api

[![CI](https://github.com/esdraspavon/karta-challenge-api/actions/workflows/ci.yml/badge.svg)](https://github.com/esdraspavon/karta-challenge-api/actions/workflows/ci.yml)

Backend for the Karta technical challenge. Node + TypeScript + Express + Knex (SQLite).

## Requirements

- Node 22+
- npm
- Python 3 + Xcode CLT (only the first time, to compile the `better-sqlite3` and `bcrypt` native bindings)

## Quick start

```bash
# 1. install
npm install

# If the native modules fail to download a prebuilt binary, force a rebuild:
#   npm rebuild better-sqlite3
#   (cd node_modules/bcrypt && npm run install)

# 2. environment
cp .env.example .env
# edit .env if you want to change ADMIN_API_KEY / JWT_SECRET / PORT

# 3. database
npm run migrate
npm run seed

# 4. run the API
npm run dev      # tsx watch on src/server.ts
# or for a compiled run:
npm run build && npm start

# 5. tests
npm test
```

The seed prints test credentials and confirms that the admin API key is registered.

## Environment variables

See `.env.example`. All variables are validated with Zod at boot — if any is missing or invalid the process exits with a clear message.

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` / `test` / `production` (selects Knex env) |
| `PORT` | HTTP port |
| `JWT_SECRET` | Secret used to sign user JWTs (min 16 chars) |
| `ADMIN_API_KEY` | Plaintext admin key. Only the SHA-256 hash is stored in the DB |
| `DB_FILE` | SQLite file used in `development` / `production` |

## API documentation (Swagger / OpenAPI)

Once the server is running, the spec is available at:

- **`http://localhost:3000/docs`** — Swagger UI (interactive playground; the "Authorize" button accepts a JWT and the admin API key).
- **`http://localhost:3000/openapi.json`** — raw OpenAPI 3.0 document.

The spec is generated from the existing Zod schemas via `@asteasolutions/zod-to-openapi`, so request/response shapes can never drift from the validation logic.

## Endpoints

### Public

- `POST /auth/login` — `{ email, password }` → `{ token, user }`

### Authenticated with user JWT (`Authorization: Bearer <jwt>`)

- `GET /me`
- `GET /me/pending-agreements` — latest version per `code` for the user's program, excluding already-signed agreements.
- `GET /me/signed-agreements` — history with the `pdf_url` snapshot at signing time.
- `POST /agreements/:agreementId/sign` — idempotent. Repeated calls with the same `(user, agreement)` always return 2xx, never 4xx, and never create a duplicate signature.

### Authenticated with admin API key (`X-API-Key: <key>`)

- `POST /admin/agreements` — `{ card_program_code, code, title, pdf_url }`. Creates `v1` if `(card_program, code)` is new, otherwise creates `vN+1`.

## Data model — quick map

- `card_programs(id, code UNIQUE, name)`
- `users(id, email UNIQUE, password_hash, card_program_id → card_programs)`
- `agreements(id, card_program_id → card_programs, code, version, title, pdf_url, published_at, UNIQUE(card_program_id, code, version))`
- `signatures(id, user_id → users, agreement_id → agreements, pdf_url_snapshot, signed_at, UNIQUE(user_id, agreement_id))`
- `api_keys(id, name, key_hash UNIQUE)` — independent of `users`.

## Auth design

Two completely independent identity systems:

- **User JWT** — signed with `JWT_SECRET`. The `authJwt` middleware extracts `Bearer <token>`, verifies and attaches `req.user`.
- **Admin API key** — header `X-API-Key`. The `apiKeyAuth` middleware hashes the value with SHA-256 and looks it up in `api_keys`. The plaintext key only lives in `.env` (gitignored). If the DB is dumped, only the hash is exposed.

## How the "pending" query works

Per request, for the user's `card_program_id`:

1. Subquery: `SELECT card_program_id, code, MAX(version) FROM agreements WHERE card_program_id = ? GROUP BY card_program_id, code` → the latest version per agreement code.
2. Join `agreements` against that subquery on `(card_program_id, code, version)`.
3. `LEFT JOIN signatures` filtered to the current user, then keep only rows where the signature side is `NULL`.

That single query returns exactly the agreements the user must sign now, even after admin publishes new versions or new codes.

## Sign idempotency

`POST /agreements/:id/sign` first does a pre-check `SELECT` for an existing signature. If found, it returns it. Otherwise it inserts; if the insert races a concurrent client and the `UNIQUE(user_id, agreement_id)` constraint fires, the error is caught (`SQLITE_CONSTRAINT_UNIQUE` / `UNIQUE constraint failed`) and the existing row is returned. Both calls always return 2xx.

## Project layout

```
src/
  config/         # env (Zod-validated) + knex instance
  db/             # migrations + seeds
  middlewares/    # validate / authJwt / apiKey / errorHandler
  modules/        # auth, users, agreements, admin (routes/controller/service/schema)
  utils/          # hash (sha256), jwt, errors
  app.ts, server.ts
tests/
  helpers/setup.ts                  # mocha root hooks (rollback + migrate + seed/cleanup per test)
  pending-agreements.spec.ts
  sign-idempotency.spec.ts
  admin-api-key.spec.ts
knexfile.ts
```

## Tests

`npm test` runs Mocha with `tsx/cjs` against a separate `test.sqlite`. Hooks:

- `beforeAll` — rollback all + migrate latest
- `beforeEach` — clean tables in reverse FK order + run seeds (so each test starts from the seed baseline)
- `afterAll` — close the DB connection

## Postman collection

`postman/karta-api.postman_collection.json` is an end-to-end suite (22 requests, 49 assertions) that walks the full flow on a **freshly seeded** DB: login, pending agreements, idempotent sign, admin version bump, snapshot verification.

```bash
# 1. reset DB and start the server
rm -f dev.sqlite && npm run migrate && npm run seed
npm run dev

# 2a. import in Postman: File → Import → pick the JSON, then run with the Collection Runner
# 2b. or run headlessly with Newman (no install required):
npx --yes newman run postman/karta-api.postman_collection.json
```

Requests run in order and chain state via collection variables (`token`, `cardholder_v1_id`, etc.). If any earlier test fails (e.g. the DB is not fresh), later ones cascade.
