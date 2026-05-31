# Coding Camp Copilot — Frontend

> **Proyek Capstone CC26-PSU096** · Coding Camp 2026 × DBS Foundation
> Tema: **Accessible & Adaptive Learning**

Asisten AI berbasis web untuk peserta Coding Camp 2026.
Mengklasifikasikan pertanyaan, mendeteksi urgensi, dan memberikan draft reply otomatis bagi fasilitator.

---

## Stack Teknologi

| Layer      | Teknologi                          |
|------------|------------------------------------|
| Framework  | React 18 + TypeScript              |
| Styling    | Tailwind CSS v4 (responsif)        |
| Bundler    | Vite 6                             |
| Routing    | React Router v7                    |
| Animasi    | Motion (Framer Motion)             |
| Icons      | Lucide React                       |


---

## Struktur Direktori

```
src/
├── app/
│   ├── App.tsx                     # Root — AuthProvider + RouterProvider
│   ├── Root.tsx                    # Layout wrapper + auth guard + ApiStatusBanner
│   ├── routes.tsx                  # Definisi semua route
│   ├── context/
│   │   └── AuthContext.tsx         # Auth — login/logout/updateUser, demo fallback
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # Persist data ke localStorage
│   │   └── useApi.ts               # Hook generik fetch + auto Bearer token
│   ├── components/
│   │   ├── Navbar.tsx              # Navigasi sticky responsif + user dropdown
│   │   ├── Footer.tsx              # Footer 3-kolom
│   │   └── ApiStatusBanner.tsx     # ★ Banner peringatan backend offline
│   └── pages/
│       ├── Splash.tsx              # Animasi splash screen (tampil sekali)
│       ├── Login.tsx               # Halaman masuk
│       ├── Register.tsx            # Halaman daftar + password strength bar
│       ├── Home.tsx                # Beranda — overview, tim, sprint, SWOT, checklist
│       ├── Chat.tsx                # ★ Fitur utama — Chat AI + Draft Reply admin
│       ├── FAQ.tsx                 # FAQ & Panduan
│       ├── History.tsx             # Riwayat pertanyaan (localStorage)
│       ├── Profile.tsx             # Profil + edit nama + info proyek
│       ├── Admin.tsx               # Panel admin — kelola peserta & riwayat chat
│       └── NotFound.tsx            # Halaman 404
└── styles/
    ├── theme.css                   # CSS variables warna DBS
    ├── index.css                   # Global reset
    ├── tailwind.css                # Konfigurasi Tailwind
    └── fonts.css                  # Font Inter
```

---

## Cara Menjalankan

### Prasyarat
- Node.js v18+
- npm v9+

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit VITE_API_URL ke URL backend

# 3. Development server
npm run dev
# Buka http://localhost:5173

# 4. Build production
npm run build
```

---

## Deployment

### Vercel
```bash
npm i -g vercel && vercel --prod
```
File `vercel.json` sudah dikonfigurasi untuk SPA routing.

### Netlify
Upload folder `dist/` atau gunakan `netlify deploy --prod --dir=dist`.
File `netlify.toml` sudah dikonfigurasi.

---

## Akun Demo

| Role    | Email                     | Password    |
|---------|--------------------------|-------------|
| Peserta | peserta@codingcamp.id    | copilot2026 |
| Admin   | admin@codingcamp.id      | admin2026   |

> Mode admin menampilkan **Draft Reply otomatis** di setiap jawaban Chat (Side Quest).

---

## Format API Backend

### POST `/predict`
```json
// Request
{ "question": "Kapan deadline capstone?" }

// Response
{
  "answer": "...",
  "category": "Jadwal",
  "urgency": "low",
  "confidence": 0.95,
  "draft_reply": "...",
  "sources": ["Gantt Chart CC26-PSU096"]
}
```

### POST `/auth/login`
```json
// Request
{ "email": "...", "password": "..." }

// Response
{ "token": "jwt...", "user": { "id", "email", "name", "role" } }
```

### POST `/auth/register`
```json
// Request
{ "email": "...", "password": "...", "full_name": "..." }
```

---

## Checklist Project Plan — Frontend

### Main Quest ✅ (sudah terpenuhi)
- [x] Networking calls ke API (`/predict`, `/auth/login`, `/health`)
- [x] Module bundler Vite
- [x] URL API mengikuti konvensi RESTful
- [x] Integrasi AI/ML sebagai fitur utama di halaman Chat
- [x] Tidak crash — fallback mock saat backend offline
- [x] Tidak menggunakan Web Generator

### Side Quest ✅ (sudah terpenuhi dari sisi frontend)
- [x] Layout responsif — Tailwind CSS `sm:` / `md:` / `lg:`
- [x] Draft Reply otomatis untuk admin — Generative AI pendukung
- [x] Config deployment — `vercel.json` + `netlify.toml`

### Menunggu Backend / AI / DS
- [ ] PostgreSQL terintegrasi (histori masih `localStorage`)
- [ ] Model TensorFlow aktual (chat masih mock)
- [ ] Live URL deployment
- [ ] Dashboard Streamlit

---

## Anggota Tim CC26-PSU096

| Nama                    | Role                    | ID              |
|------------------------|------------------------|-----------------|
| Rizki Alsyareno         | Full-Stack Web Developer | CFCC848D6Y0433 |
| Siti Nur Padila         | Full-Stack Web Developer | CFCC809D6X0843 |
| Naila Hilwatus Syifa    | AI Engineer             | CACC284D6X1586 |
| Gabriella Elizabeth D.  | AI Engineer             | CACC284D6X1746 |
| Anthony Saputra         | Data Scientist          | CDCC429D6Y0092 |
| Devi Listiani Safitri   | Data Scientist          | CDCC226D6X1183 |

---

*Coding Camp 2026 × DBS Foundation · Road to Future Workforce*
