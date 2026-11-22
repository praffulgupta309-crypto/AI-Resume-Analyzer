# AI Resume Analyzer & Career Booster - Backend

A FastAPI-powered backend that extracts text from resumes (PDF and DOCX), sends it alongside a job description to Google Gemini using structured JSON output, assesses ATS alignment, stores analysis history in a SQLite database, generates tailored cover letters and interview preparation kits, and powers an interactive, stateful career coach using the Gemini Interactions API.

## Tech Stack
- **Python 3**
- **FastAPI**: Modern, asynchronous web framework
- **Uvicorn**: High-performance ASGI server
- **SQLAlchemy & SQLite**: Database ORM and persistent storage
- **pypdf**: Robust PDF text extraction
- **python-docx**: Microsoft Word (.docx) document parsing
- **python-dotenv**: Environment configuration loading
- **google-genai**: Official Google Gemini Python SDK (Interactions API & Structured Output)

---

## Getting Started

### 1. Environment Setup
The virtual environment is located at `backend/venv`.
Ensure your Google Gemini API key is configured in `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-4-hydrogen
```

> Obtain an API key from [Google AI Studio](https://aistudio.google.com/).

### 2. Activate Virtual Environment & Run the Server
From the `backend` folder:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or run directly with the virtualenv Python:
```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run Backend Tests
```powershell
.\venv\Scripts\python.exe -m unittest discover -s . -p "test_*.py"
```

---

## API Endpoints

### 1. `POST /api/analyze`
Accepts a multipart form upload:
- `file`: Resume file in **PDF (.pdf)** or **Word (.docx)** format (max **5 MB**).
- `job_description`: Plain text describing the target job role.

**Response Structure (Structured JSON):**
```json
{
  "id": 1,
  "filename": "resume.pdf",
  "file_type": "pdf",
  "ats_score": 85,
  "matched_skills": ["Python", "FastAPI", "SQL", "Docker"],
  "missing_keywords": ["Kubernetes", "GraphQL", "CI/CD"],
  "section_feedback": {
    "summary": "Strong professional summary highlighting backend expertise.",
    "experience": "Demonstrates good project delivery and engineering discipline.",
    "skills": "Good alignment with core backend stack, but missing cloud orchestration.",
    "formatting": "Clean layout and standard bullet points."
  },
  "improved_bullets": [
    "Architected and deployed 15+ FastAPI microservices, reducing API response latency by 35%.",
    "Streamlined database queries with SQLAlchemy ORM, cutting average query load times by 40%.",
    "Automated CI/CD pipelines using Docker, accelerating feature delivery cycles from bi-weekly to daily."
  ],
  "created_at": "2026-11-22T11:15:00.000000+00:00"
}
```

---

### 2. `POST /api/cover-letter` *(New Gemini API Feature)*
Generates a customized, high-converting cover letter grounded in candidate achievements and tailored to the target role.

**Request Body (JSON):**
```json
{
  "analysis_id": 1,
  "company_name": "Google",
  "recipient_name": "Engineering Hiring Team",
  "tone": "executive"
}
```
*(Alternatively pass `resume_text` and `job_description` directly without `analysis_id`)*

**Response Structure:**
```json
{
  "cover_letter": "Dear Engineering Hiring Team,\n\nI am excited to submit my application for...",
  "subject_line": "Senior Backend Engineer Application - John Doe",
  "key_strengths_highlighted": [
    "FastAPI microservice scalability",
    "SQLAlchemy performance tuning"
  ],
  "tone_used": "executive",
  "company_name": "Google",
  "created_at": "2026-11-22T11:35:00.000000+00:00"
}
```

---

### 3. `POST /api/interview-prep` *(New Gemini API Feature)*
Generates a targeted interview preparation kit with STAR-method behavioral guidance, technical scenarios, and gap-mitigation strategies.

**Request Body (JSON):**
```json
{
  "analysis_id": 1
}
```

**Response Structure:**
```json
{
  "role_summary": "High alignment for core backend engineering; focus on container orchestration.",
  "behavioral_questions": [
    {
      "question": "Tell me about a high-latency bottleneck you resolved in production.",
      "focus_competency": "Performance Optimization & Troubleshooting",
      "star_guidance": "Describe the FastAPI endpoint profiling (Situation), query load (Task), SQLAlchemy index refactor (Action), and 40% latency reduction (Result)."
    }
  ],
  "technical_questions": [
    {
      "question": "How does FastAPI handle asynchronous tasks compared to traditional WSGI frameworks?",
      "skill_targeted": "FastAPI & Asyncio",
      "key_points_to_mention": ["ASGI event loop", "Uvicorn workers", "concurrency vs thread overhead"]
    }
  ],
  "gap_mitigation_questions": [
    {
      "potential_concern": "Limited hands-on Kubernetes experience.",
      "question": "Our deployment targets Kubernetes clusters. How comfortable are you operating in this environment?",
      "recommended_strategy": "Acknowledge container orchestration learning curve, emphasize strong Docker foundation, and cite fast ramp-up ability."
    }
  ],
  "questions_to_ask_employer": [
    "What does your current deployment and observability pipeline look like?",
    "How does the engineering team balance technical debt reduction with product feature velocity?"
  ],
  "created_at": "2026-11-22T11:35:00.000000+00:00"
}
```

---

### 4. `POST /api/coach` *(New Gemini API Feature)*
Conversational AI resume and career coach using Gemini's **stateful Interactions API** (`previous_interaction_id`).

**First Turn Request (JSON):**
```json
{
  "analysis_id": 1,
  "message": "How can I rewrite my experience bullet to emphasize Docker containerization?"
}
```

**First Turn Response:**
```json
{
  "reply": "Here is an optimized revision using the Google XYZ formula:\n\n- Containerized 12+ legacy microservices using multi-stage Dockerfiles, decreasing image deployment sizes by 60% and reducing onboarding build times from 45 to 8 minutes.",
  "interaction_id": "inter_abc12345",
  "created_at": "2026-11-22T11:36:00.000000+00:00"
}
```

**Subsequent Multi-Turn Request:**
```json
{
  "previous_interaction_id": "inter_abc12345",
  "message": "Can you give me a second variation focusing more on CI/CD pipeline integration?"
}
```

---

### 5. `GET /api/history`
Returns a list of all historical analyses stored in SQLite, ordered from newest to oldest.

### 6. `DELETE /api/history/{id}`
Deletes an analysis record by its ID.

### 7. Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## CORS
CORS is enabled for `http://localhost:5173` (standard Vite frontend dev server) and `http://127.0.0.1:5173`.
