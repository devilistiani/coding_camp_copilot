# Postman Collection — Coding Camp Copilot Backend

## File yang Tersedia

| File | Fungsi |
|---|---|
| `Coding-Camp-Copilot.postman_collection.json` | Collection lengkap semua endpoint + script auto-save token + error test cases |
| `Coding-Camp-Copilot.postman_environment.json` | Environment variables (`base_url`, `access_token`, `refresh_token`, dll) |

## Cara Import ke Postman

### Cara 1 (Recommended) — Import file collection custom

1. Buka **Postman**
2. Klik **Import** (button di kiri atas)
3. Drag & drop kedua file `.json` di folder ini (atau pilih via file browser)
4. Pojok kanan atas Postman: ganti environment ke **"Local Dev"** (dropdown)
5. Pastikan backend jalan: `cd RestAPI && npm run dev` (port 5001)
6. Mulai dari **Auth → Login — User** atau **Auth → Login — Admin**
   - Token otomatis tersimpan ke environment variable (lihat console: View → Show Postman Console)
7. Sekarang request lain (Get Me, Refresh, Logout) auto-pakai token tersebut

### Cara 2 — Import dari Swagger spec backend (auto-generate)

Postman bisa langsung baca OpenAPI spec dan generate collection otomatis.

1. Pastikan backend jalan (`npm run dev`)
2. Buka Postman → **Import** → tab **Link**
3. Paste URL: `http://localhost:5001/api/docs.json`
4. Postman akan auto-generate collection dengan semua endpoint

**Tradeoff Cara 2**:
- ✅ Selalu sync dengan backend terbaru (kalau endpoint berubah, tinggal re-import)
- ❌ Gak ada script auto-save token (harus copy-paste manual)
- ❌ Gak ada example body yang udah diisi (cuma type info dari schema)

## Struktur Collection (Cara 1)

```
Coding Camp Copilot — Backend API
├── Health
│   ├── Health Check          → GET /health
│   └── Root Info             → GET /
├── Auth
│   ├── Register              → POST /auth/register
│   ├── Login — User          → POST /auth/login  (auto-save token)
│   ├── Login — Admin         → POST /auth/login  (auto-save token)
│   ├── Get Me                → GET  /auth/me
│   ├── Refresh Token         → POST /auth/refresh  (rotate token)
│   └── Logout                → POST /auth/logout
└── Error Cases (Test Validation)
    ├── Register — Email Sudah Ada     → expect 409
    ├── Register — Password Lemah      → expect 400
    ├── Login — Password Salah         → expect 401
    ├── Me — Tanpa Token               → expect 401
    └── Me — Token Invalid             → expect 401
```

## Skenario Test Lengkap (Manual Run, ~30 detik)

Order ini cover semua flow:

1. **Health Check** → cek server alive
2. **Login — User** → token auto-saved
3. **Get Me** → konfirmasi token bekerja, dapat info user
4. **Refresh Token** → token rotated (refresh lama dicabut)
5. **Logout** → token revoked
6. **Get Me** → seharusnya **401** (token sudah revoked di server? Nope — access token masih valid sampai expire 15min, **hanya refresh** yang dicabut)
7. **Refresh Token** → seharusnya **401** (refresh token sudah revoked)

Atau bisa juga **Run Collection** (klik tombol "Run" di Postman) untuk eksekusi semua otomatis dalam urutan.

## Demo Accounts (dari seed)

| Email | Password | Role |
|---|---|---|
| `user@codingcamp.id` | `copilot2026` | user |
| `admin@codingcamp.id` | `admin2026` | admin |

## Catatan

- **Rate limit**: 5 request/menit/IP untuk `/auth/register` & `/auth/login` (shared bucket). Kalau test banyak, tunggu 60 detik.
- **Bearer auth**: Collection udah set default auth `Bearer {{access_token}}` — semua request yang butuh auth otomatis pakai token dari environment. Request public (login, register, refresh, logout, health) override jadi `noauth`.
- **Console log**: View → Show Postman Console untuk lihat output script (status login, token rotation, dll).
