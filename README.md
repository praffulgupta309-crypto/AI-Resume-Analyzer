# AI Resume Analyzer & Career Booster (Gemini Powered)

An intelligent full-stack AI platform that analyzes resumes against target job descriptions, scores ATS compatibility, highlights matching and missing skills, rewrites resume bullet points using the Google XYZ formula, generates tailored cover letters and interview preparation kits, and offers a real-time conversational career coach.

---

## Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python 3.14+)
- **Server**: Uvicorn
- **AI Engine**: Google Gemini API (`google-genai` SDK)
- **Document Parsers**: `pypdf`, `python-docx`
- **Database**: SQLite with SQLAlchemy ORM
- **Deployment**: Render

---

## Deployment Guide

### 1. Backend on Render
1. Create a new **Web Service** on [Render](https://render.com) connected to this repository.
2. Set the configuration:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API Key from Google AI Studio.
   - `GEMINI_MODEL`: (Optional, defaults to `gemini-4-hydrogen` or `gemini-2.5-flash`).
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`) for CORS permissions.

### 2. Frontend on Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Set the configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
3. Add Environment Variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://your-backend.onrender.com`).
4. Click **Deploy**.

---

## Local Development

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.
API Swagger documentation is accessible at `http://localhost:8000/docs`.
