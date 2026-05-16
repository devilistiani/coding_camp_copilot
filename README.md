# Coding Camp Copilot — Backend

REST API untuk Capstone Project **CC26-PSU096** (DBS Foundation x Dicoding 2026).

> **Status saat ini**: hanya modul **Authentication** yang sudah live. Modul lain (chat, knowledge base, dll) menyusul di sprint berikutnya.

## Tech Stack

- **Runtime**: Node.js 20+
- **Bahasa**: TypeScript 5
- **Framework**: Express.js 4
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5
- **Auth**: JWT (access + refresh, dengan rotation)
- **Validation**: Zod
- **Logging**: Pino
- **Docs**: Swagger UI (auto-generated dari JSDoc)
- **Dev runner**: tsx (no compile step di dev)

## Prasyarat

1. **Node.js 20+** — cek dengan `node -v`
2. **PostgreSQL 15+** running lokal di port 5432 (atau ubah `DATABASE_URL` di `.env`)
3. Database `copilot_db` sudah dibuat (atau pakai db lain, sesuaikan url)

### Quick setup PostgreSQL lokal (macOS, pakai Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
createdb copilot_db
psql copilot_db -c "CREATE USER copilot WITH PASSWORD 'copilot_pass';"
psql copilot_db -c "GRANT ALL PRIVILEGES ON DATABASE copilot_db TO copilot;"
psql copilot_db -c "GRANT ALL ON SCHEMA public TO copilot;"
```

## Setup Project

```bash
# 1. Install dependencies
npm install

# 2. Copy & isi .env
cp .env.example .env
# lalu edit .env, isi DATABASE_URL & JWT secrets
# generate secret yang aman:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Generate Prisma client + run migration
npx prisma migrate dev --name init

# 4. Seed demo accounts (user & admin)
npm run prisma:seed

# 5. Run dev server
npm run dev
```

Setelah `npm run dev`, server jalan di **http://localhost:5000**:

- 📘 **API Docs**: http://localhost:5000/api/docs
- 💚 **Health**: http://localhost:5000/api/v1/health
- 🏠 **Root**: http://localhost:5000

## Demo Accounts (dari seed)

| Email | Password | Role |
|---|---|---|
| `user@codingcamp.id` | `copilot2026` | user |
| `admin@codingcamp.id` | `admin2026` | admin |

## Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Run dev server dengan auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm start` | Run production build (perlu `npm run build` dulu) |
| `npm run typecheck` | Cek TypeScript errors tanpa compile |
| `npm run prisma:generate` | Generate Prisma client (otomatis setelah migrate) |
| `npm run prisma:migrate` | Buat & apply migration baru |
| `npm run prisma:studio` | Buka Prisma Studio (DB GUI) di browser |
| `npm run prisma:seed` | Seed demo accounts |
| `npm run db:reset` | ⚠️ Reset DB & re-run migration & seed (HAPUS SEMUA DATA) |

## Struktur Folder

```
backend/
├── prisma/
│   ├── schema.prisma          # DB schema (User, RefreshToken)
│   └── seed.ts                # Seed demo accounts
├── src/
│   ├── config/
│   │   └── env.ts             # Env validation pakai Zod
│   ├── lib/                   # Utility murni (no business logic)
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── jwt.ts             # Sign/verify JWT, hash refresh token
│   │   ├── password.ts        # bcrypt hash & verify
│   │   ├── logger.ts          # Pino logger
│   │   └── ApiError.ts        # Standard error class
│   ├── middlewares/
│   │   ├── authenticate.ts    # Verify access token → req.user
│   │   ├── authorize.ts       # Check role(s)
│   │   ├── validate.ts        # Zod validation middleware
│   │   └── errorHandler.ts    # Global error handler
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.schema.ts      # Zod schemas (register, login, refresh)
│   │       ├── auth.service.ts     # Business logic
│   │       ├── auth.controller.ts  # HTTP handlers
│   │       └── auth.routes.ts      # Express router + Swagger JSDoc
│   ├── docs/
│   │   └── swagger.ts         # OpenAPI spec config
│   ├── types/
│   │   └── express.d.ts       # Extend Request type with `user`
│   ├── routes.ts              # Main router
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Entry point + graceful shutdown
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Endpoints (so far)

Semua endpoint API di-prefix `/api/v1`.

| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| GET | `/health` | ❌ | Health check + DB ping |
| POST | `/auth/register` | ❌ | Daftar user baru (default role: user) |
| POST | `/auth/login` | ❌ | Login → access + refresh token |
| POST | `/auth/refresh` | ❌ | Tukar refresh token → access token baru (rotated) |
| POST | `/auth/logout` | ❌ | Revoke refresh token |
| GET | `/auth/me` | ✅ | Info user sedang login |

**Lihat dokumentasi lengkap interaktif di** [`/api/docs`](http://localhost:5000/api/docs) **setelah server jalan.**

## Format Response

### Success (2xx)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [
      { "field": "email", "issue": "Format email tidak valid" }
    ]
  }
}
```

### Error codes
`VALIDATION_ERROR` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT` · `RATE_LIMITED` · `INTERNAL_ERROR`

## Auth Flow

1. **Register/Login** → dapat `token` (15 menit) + `refresh_token` (7 hari)
2. Pakai `token` di header: `Authorization: Bearer <token>` untuk protected endpoints
3. Saat `token` expired (HTTP 401), panggil `POST /auth/refresh` dengan `refresh_token`
4. Refresh akan **rotate**: refresh token lama dicabut, dapat yang baru
5. **Logout**: panggil `POST /auth/logout` dengan refresh token → token dicabut di DB

## Testing Manual via cURL

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@codingcamp.id","password":"copilot2026"}'

# Get me (ganti TOKEN dengan token dari login)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"

# Refresh token (ganti REFRESH_TOKEN)
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"REFRESH_TOKEN"}'
```

## Catatan untuk Tim Frontend (Siti)

- **Base URL dev**: `http://localhost:5000/api/v1`
- **Format login response** sudah disesuaikan supaya field `token` & `user` ada di top-level `data`:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id", "email", "name", "role" },
      "token": "...",
      "refresh_token": "...",
      "expires_in": 900
    }
  }
  ```
- ⚠️ Frontend perlu update sedikit untuk baca dari `data.user` & `data.token` (bukan `user` & `token` di top-level seperti di `AuthContext.tsx` Siti yang sekarang)
- ⚠️ Role di frontend perlu rename `"peserta" | "fasilitator"` → `"user" | "admin"` di type `AuthUser`
- Demo akun final (replace yang lama di mock Siti):
  - `user@codingcamp.id` / `copilot2026` (role: user)
  - `admin@codingcamp.id` / `admin2026` (role: admin)

## Catatan untuk Deployment (VPS)

Belum di-deploy. Akan ditambahkan saat sprint deployment:
- Process: PM2 (`pm2 start dist/server.js --name copilot-backend -i max`)
- Reverse proxy: Nginx → forward `/api/*` ke port 5000
- Run migration: `npx prisma migrate deploy` (production-safe, gak buat migration baru)

## TODO (Next Sprints)

- [ ] Modul Conversations & Messages
- [ ] Modul Knowledge Base (CRUD)
- [ ] Modul Categories
- [ ] Integrasi ke ML Service (`POST /chat`)
- [ ] Endpoint analytics untuk dashboard Streamlit
- [ ] Rate limiting per-user (selain per-IP)
- [ ] Unit tests + integration tests
- [ ] CI/CD via GitHub Actions
