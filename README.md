# Coding Camp Copilot

Capstone Project **CC26-PSU096** — DBS Foundation × Dicoding 2026.

Live:
- Frontend: <https://codingcampcopilot.web.id>
- API: <https://api.codingcampcopilot.web.id/api/v1>
- API Docs: <https://api.codingcampcopilot.web.id/api/docs>

## Struktur

```
main/
├── FullStack/         # Frontend (React + Vite) + Backend (Express + Prisma)
├── DataScience/       # Notebook preprocessing + dashboard Streamlit
└── AI-Engineer/       # FastAPI + TensorFlow + Gemini
```

## Instalasi

### AI Engineer

```bash
cd AI-Engineer
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt

echo "gemini_key=YOUR_GEMINI_API_KEY" > .env

uvicorn main:app --reload --port 8000
```

Server: <http://localhost:8000> · Docs: <http://localhost:8000/docs>

### Data Science

```bash
cd DataScience
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt -r requirements_model.txt

streamlit run dashboard.py
```

Dashboard: <http://localhost:8501>

### Backend (RestAPI)

```bash
cd FullStack/RestAPI
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT secrets, AI_SERVICE_URL

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Server: <http://localhost:5001> · Docs: <http://localhost:5001/api/docs>

### Frontend

```bash
cd FullStack/Frontend
npm install
echo "VITE_API_URL=http://localhost:5001/api/v1" > .env.local
npm run dev
```

Server: <http://localhost:5173>
