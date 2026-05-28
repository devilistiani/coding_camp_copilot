# Coding Camp Copilot — AI API

Repository ini berisi REST API mandiri yang dikembangkan menggunakan **FastAPI** untuk melayani model Machine Learning (*Intent Classification*) berbasis Deep Learning (BiLSTM) dan integrasi auto-reply menggunakan **Gemini 2.5-Flash**.

---

## Struktur Project

```text
copilot-ai-api/
├── assets/
│   ├── copilot_intent_model_best.keras  # Checkpoint model terbaik (BiLSTM)
│   └── tokenizer_config.json            # Konfigurasi vocabulary tokenizer
├── model/
│   ├── predict.py                       # Logika inference & integrasi Gemini
│   └── preprocessing.py                 # Pipeline text cleaning & stop-words
├── .env                                 # API Key Gemini (Lokal saja)
├── main.py                              # Aplikasi utama FastAPI
└── requirements.txt                     # Dependencies project
```

---

## Cara Instalasi dan Menjalankan di Lokal

### 1. Setup Virtual Environment

```bash
# Membuat venv baru jika belum ada
python -m venv env

# Mengaktifkan venv (Windows PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& env/Scripts/Activate.ps1
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Konfigurasi Environment Variable

```env
GEMINI_API_KEY=api_key_gemini
```

### 4. Jalankan Server FastAPI

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API akan berjalan di `http://localhost:8000` dan dokumentasi interaktif Swagger UI dapat diakses di `http://localhost:8000/docs`.
