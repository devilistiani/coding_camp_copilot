# Coding Camp Copilot — Backend (RestAPI)

REST API untuk Capstone Project **CC26-PSU096** — DBS Foundation × Dicoding 2026.

> Saat ini live: **Authentication module**. Modul lain (Chat, Knowledge Base, ML Integration) menyusul.

## Tech Stack

Node.js 20 · TypeScript · Express · PostgreSQL 15 · Prisma · JWT · Zod · Pino · Swagger UI

## Endpoints (prefix `/api/v1`)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| `GET` | `/health` | ❌ | Health check + DB ping |
| `POST` | `/auth/register` | ❌ | Daftar user baru (default role: `user`) |
| `POST` | `/auth/login` | ❌ | Login → access token (15m) + refresh token (7d) |
| `POST` | `/auth/refresh` | ❌ | Rotate refresh token → access baru |
| `POST` | `/auth/logout` | ❌ | Revoke refresh token |
| `GET` | `/auth/me` | ✅ | Info user yang sedang login |

📘 Dokumentasi interaktif: http://localhost:5001/api/docs

## Setup Cepat

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env
# Edit .env — isi DATABASE_URL & JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Migrate + seed
npx prisma migrate dev --name init
npm run prisma:seed

# 4. Run
npm run dev
```

Server: **http://localhost:5001**

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `user@codingcamp.id` | `copilot2026` | user |
| `admin@codingcamp.id` | `admin2026` | admin |

## Testing

- **Swagger UI**: http://localhost:5001/api/docs — try-out langsung dari browser
- **Postman**: import dari folder [`postman/`](./postman/) (collection + environment)

## Scripts

```bash
npm run dev              # Dev server dengan auto-reload
npm run build            # Compile ke dist/
npm run typecheck        # Cek TypeScript errors
npm run prisma:studio    # Buka DB GUI
npm run prisma:seed      # Re-seed demo accounts
```
