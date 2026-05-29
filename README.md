# Coding Camp Copilot — Backend (RestAPI)

REST API untuk Capstone Project **CC26-PSU096** — DBS Foundation × Dicoding 2026.

> AI chat customer service untuk peserta Coding Camp.

## Tech Stack

Node.js 20 · TypeScript · Express · PostgreSQL 15 · Prisma · JWT · Zod · Pino · Swagger UI

## Endpoints (prefix `/api/v1`)

**Health**

| Method | Path      | Auth | Fungsi                                  |
| ------ | --------- | ---- | --------------------------------------- |
| `GET`  | `/health` |      | Health check — server + DB + AI service |

**Auth** — rate limit 5/min untuk `/register` & `/login`

| Method  | Path             | Auth   | Fungsi                                          |
| ------- | ---------------- | ------ | ----------------------------------------------- |
| `POST`  | `/auth/register` |        | Daftar user baru (default role: `peserta`)      |
| `POST`  | `/auth/login`    |        | Login → access token (15m) + refresh token (7d) |
| `POST`  | `/auth/refresh`  |        | Rotate refresh token → access baru              |
| `POST`  | `/auth/logout`   |        | Revoke refresh token                            |
| `GET`   | `/auth/me`       | Bearer | Info user yang sedang login                     |
| `PATCH` | `/auth/me`       | Bearer | Update profile (`full_name`)                    |

**Chat** — rate limit 30/min/user untuk `/chat` & `/predict`

| Method   | Path                 | Auth   | Fungsi                                                |
| -------- | -------------------- | ------ | ----------------------------------------------------- |
| `POST`   | `/chat`              | Bearer | Kirim pertanyaan → AI klasifikasi + reply, simpan DB  |
| `POST`   | `/predict`           | Bearer | Klasifikasi flat & stateless (gak simpan ke DB)       |
| `GET`    | `/conversations`     | Bearer | List conversations (paginated, `?q`, `?mine`, `?page`)|
| `GET`    | `/conversations/:id` | Bearer | Detail conversation + semua messages                  |
| `PATCH`  | `/conversations/:id` | Bearer | Update title                                          |
| `DELETE` | `/conversations/:id` | Bearer | Hapus conversation (cascade messages)                 |

**Admin** — wajib role `admin`

| Method   | Path                       | Fungsi                                                    |
| -------- | -------------------------- | --------------------------------------------------------- |
| `GET`    | `/admin/users`             | List users (paginated, `?q`, `?status`, `?role`)          |
| `PATCH`  | `/admin/users/:id`         | Update user (`full_name`, `is_active`, `role`)            |
| `DELETE` | `/admin/users/:id`         | Hapus user (cascade tokens + conversations)               |
| `GET`    | `/admin/analytics/summary` | Aggregated stats: users, chats, AI confidence, trend 30 hari |

Dokumentasi interaktif: http://localhost:5001/api/docs

## Setup Cepat

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env
# Edit .env — isi DATABASE_URL, AI_SERVICE_URL, & generate JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Migrate + seed
npx prisma migrate dev --name init
npm run prisma:seed

# 4. Run
npm run dev
```

Server: **http://localhost:5001**

## Demo Accounts

| Email                   | Password      | Role    |
| ----------------------- | ------------- | ------- |
| `peserta@codingcamp.id` | `copilot2026` | peserta |
| `admin@codingcamp.id`   | `admin2026`   | admin   |

## AI Service

Backend terhubung ke AI Service (FastAPI + TensorFlow BiLSTM + Gemini 2.5-flash) untuk klasifikasi pertanyaan dan auto-reply. `AI_SERVICE_URL` wajib URL valid — backend fail start kalau env-nya invalid.

Kalau AI service down/timeout, endpoint `/chat` dan `/predict` return **503** atau **504**.

## Testing

- **Swagger UI**: http://localhost:5001/api/docs — try-out langsung dari browser
- **Postman**: import dari folder [`postman/`](./postman/) (collection 28 request + environment, token auto-save setelah login)

## Scripts

```bash
npm run dev              # Dev server dengan auto-reload
npm run build            # Compile ke dist/
npm run typecheck        # Cek TypeScript errors
npm run prisma:studio    # Buka DB GUI
npm run prisma:seed      # Re-seed demo accounts
```
