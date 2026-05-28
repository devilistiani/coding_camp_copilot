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
