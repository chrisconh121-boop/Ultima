---
name: FarmCity stack
description: Monorepo structure, key deps, DB tables, and WebSocket message protocol for FarmCity
---

## Artifact layout
- `artifacts/farmcity` — React + Vite frontend (port from env PORT, preview path `/`)
- `artifacts/api-server` — Express + WS backend (port 8080, paths `/api` + `/ws`)
- `lib/db` — Drizzle schema (pg)
- `lib/api-spec` — OpenAPI YAML + Orval codegen → `lib/api-client-react` + `lib/api-zod`

## DB tables
- `players` — id, username (unique), passwordHash, isOnline, createdAt
- `avatars` — id, playerId (FK, unique), skinColor, hairColor, hairStyle, shirtColor, pantsColor, hatStyle (nullable), accessory (nullable)
- `player_positions` — playerId (PK/FK), posX (real), posY (real)
- `chat_messages` — id, playerId (FK), message, createdAt

## Key deps added to api-server
- `bcryptjs` + `@types/bcryptjs`
- `jsonwebtoken` + `@types/jsonwebtoken`
- `ws` + `@types/ws`

## WebSocket protocol (server path: `/ws?token=<JWT>`)
- Server → client: `players_update` (on join), `player_joined`, `player_moved`, `player_left`, `chat_message`
- Client → server: `move` (posX, posY), `chat` (message)
- http.createServer wraps Express app; `createWebSocketServer(server)` attaches WS

## Auth
- JWT via `jsonwebtoken`, signed with `SESSION_SECRET` env var
- Bearer token in `Authorization` header
- `setAuthTokenGetter` must read `localStorage.getItem('farmcity_token')` directly (never close over React state)

**Why:** React state updates are async — a closure over state captures stale token. localStorage is always current.

## Frontend pages
- `/loading` → `pages/loading.tsx` — animated splash
- `/` → `pages/home.tsx` — login/register
- `/avatar` → `pages/avatar.tsx` — avatar creator
- `/plaza` → `pages/plaza.tsx` — main isometric game world
- `*` → `pages/not-found.tsx`

## OpenAPI collision rule
Orval emits `<OperationIdPascal>Body` in `generated/api.ts` for request bodies. Avoid naming component schemas with that pattern. Also avoid `<OperationIdPascal>Response` for response schemas — they collide with Zod response names. Rename to e.g. `LogoutResult` instead of `LogoutResponse`.
