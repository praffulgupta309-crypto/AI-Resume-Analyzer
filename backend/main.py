import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Load environment variables from backend/.env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))

from database import get_db, init_db
from models import AnalysisRecord
from parser import extract_resume_text
from analyzer import (
    analyze_resume_with_gemini,
    generate_cover_letter_with_gemini,
    generate_interview_prep_with_gemini,
    chat_with_coach_gemini,
)
from schemas import (
    AnalysisResponse,
    AnalysisHistoryItem,
    DeleteResponse,
    ResumeAnalysis,
    SectionFeedback,
    CoverLetterRequest,
    CoverLetterResponse,
    InterviewPrepRequest,
    InterviewPrepResponse,
    CoachChatRequest,
    CoachChatResponse,
)

# Maximum file size allowed: 5 MB
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    init_db()
    yield

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Backend API to parse resumes, analyze ATS match against job descriptions using Google Gemini, generate tailored cover letters and interview prep kits, and provide stateful AI coaching.",
    version="1.1.0",
    lifespan=lifespan,
)

# Enable CORS for http://localhost:5173 and optional FRONTEND_URL for production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    for url in frontend_url.split(","):
        cleaned_url = url.strip().rstrip("/")
        if cleaned_url and cleaned_url not in origins:
            origins.append(cleaned_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
def read_root():
    return {
        "name": "AI Resume Analyzer Backend",
        "version": "1.1.0",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "analyze": "POST /api/analyze",
            "history": "GET /api/history",
            "delete_history": "DELETE /api/history/{id}",
            "cover_letter": "POST /api/cover-letter",
            "interview_prep": "POST /api/interview-prep",
            "coach": "POST /api/coach",
        },
    }

@app.get("/api/health", tags=["General"])
def health_check():
    api_key_configured = bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY").strip())
    preferred_model = os.getenv("GEMINI_MODEL", "gemini-4-hydrogen").strip()
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_api_key_configured": api_key_configured,
        "gemini_model": preferred_model,
    }

@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Resume Analysis"],
    summary="Upload resume and analyze against job description",
)
async def analyze_resume(
    file: UploadFile = File(..., description="Resume file in PDF (.pdf) or Word (.docx) format, max 5 MB"),
    job_description: str = Form(..., description="Target job description text"),
    db: Session = Depends(get_db),
):
    # 1. Validate job description
    cleaned_jd = job_description.strip()
    if not cleaned_jd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty. Please provide the job requirements.",
        )

    # 2. Validate file presence and format
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was uploaded.",
        )

    filename_lower = file.filename.lower()
    ext = filename_lower.rsplit(".", 1)[-1] if "." in filename_lower else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Only PDF (.pdf) and Word (.docx) files are supported.",
        )

    # 3. Read file and validate file size (max 5 MB)
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes).",
        )

    if len(contents) > MAX_FILE_SIZE_BYTES:
        mb_size = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File size exceeds the 5 MB limit. Uploaded file is {mb_size:.2f} MB.",
        )

    # 4. Extract resume text
    try:
        resume_text = extract_resume_text(file.filename, contents)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error extracting text: {str(e)}",
        )

    if len(resume_text.strip()) < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted text is too short to be a valid resume (less than 30 characters).",
        )

    # 5. Send to Gemini for structured JSON analysis
    try:
        analysis_result: ResumeAnalysis = analyze_resume_with_gemini(
            resume_text=resume_text,
            job_description=cleaned_jd,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini AI analysis failed: {str(e)}",
        )

    # 6. Store in SQLite
    try:
        record = AnalysisRecord(
            filename=file.filename,
            file_type=ext,
            job_description=cleaned_jd,
            ats_score=analysis_result.ats_score,
            matched_skills=json.dumps(analysis_result.matched_skills),
            missing_keywords=json.dumps(analysis_result.missing_keywords),
            section_feedback=json.dumps(analysis_result.section_feedback.model_dump()),
            improved_bullets=json.dumps(analysis_result.improved_bullets),
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist analysis to database: {str(e)}",
        )

    return AnalysisResponse(
        id=record.id,
        filename=record.filename,
        file_type=record.file_type,
        ats_score=analysis_result.ats_score,
        matched_skills=analysis_result.matched_skills,
        missing_keywords=analysis_result.missing_keywords,
        section_feedback=analysis_result.section_feedback,
        improved_bullets=analysis_result.improved_bullets,
        created_at=record.created_at.isoformat(),
    )

@app.get(
    "/api/history",
    response_model=List[AnalysisHistoryItem],
    tags=["Analysis History"],
    summary="Get all stored resume analyses",
)
def get_analysis_history(db: Session = Depends(get_db)):
    records = db.query(AnalysisRecord).order_by(AnalysisRecord.id.desc()).all()
    results = []
    for r in records:
        results.append(
            AnalysisHistoryItem(
                id=r.id,
                filename=r.filename,
                file_type=r.file_type,
                job_description=r.job_description,
                ats_score=r.ats_score,
                matched_skills=json.loads(r.matched_skills) if isinstance(r.matched_skills, str) else r.matched_skills,
                missing_keywords=json.loads(r.missing_keywords) if isinstance(r.missing_keywords, str) else r.missing_keywords,
                section_feedback=SectionFeedback(**(json.loads(r.section_feedback) if isinstance(r.section_feedback, str) else r.section_feedback)),
                improved_bullets=json.loads(r.improved_bullets) if isinstance(r.improved_bullets, str) else r.improved_bullets,
                created_at=r.created_at.isoformat() if r.created_at else datetime.now(timezone.utc).isoformat(),
            )
        )
    return results

@app.delete(
    "/api/history/{id}",
    response_model=DeleteResponse,
    tags=["Analysis History"],
    summary="Delete an analysis by ID",
)
def delete_analysis(id: int, db: Session = Depends(get_db)):
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID {id} not found.",
        )
    try:
        db.delete(record)
        db.commit()
        return DeleteResponse(message="Analysis deleted successfully.", id=id)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete analysis: {str(e)}",
        )

# ==================== New Feature Endpoints ====================

@app.post(
    "/api/cover-letter",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_200_OK,
    tags=["Career Acceleration"],
    summary="Generate tailored, high-converting cover letter",
)
def generate_cover_letter_endpoint(
    req: CoverLetterRequest,
    db: Session = Depends(get_db),
):
    """
    Generates a personalized, persuasive cover letter matching the candidate's verified
    achievements to the target role requirements using Gemini API.
    """
    resume_context = ""
    job_description = ""

    if req.analysis_id is not None:
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == req.analysis_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID {req.analysis_id} not found.",
            )
        job_description = req.job_description or record.job_description
        matched = json.loads(record.matched_skills) if isinstance(record.matched_skills, str) else record.matched_skills
        missing = json.loads(record.missing_keywords) if isinstance(record.missing_keywords, str) else record.missing_keywords
        bullets = json.loads(record.improved_bullets) if isinstance(record.improved_bullets, str) else record.improved_bullets
        feedback = json.loads(record.section_feedback) if isinstance(record.section_feedback, str) else record.section_feedback

        resume_context = req.resume_text or (
            f"Resume File: {record.filename}\n"
            f"ATS Score: {record.ats_score}/100\n"
            f"Matched Core Skills: {', '.join(matched)}\n"
            f"Areas for Improvement/Missing Keywords: {', '.join(missing)}\n"
            f"Accomplishment Highlights:\n" + "\n".join(f"- {b}" for b in bullets) + "\n"
            f"Section Evaluation Summary: {feedback.get('experience', '')}"
        )
    else:
        if not req.resume_text or not req.resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'analysis_id' or 'resume_text' must be provided.",
            )
        if not req.job_description or not req.job_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description cannot be empty. Please provide the target job description.",
            )
        resume_context = req.resume_text.strip()
        job_description = req.job_description.strip()

    try:
        result = generate_cover_letter_with_gemini(
            resume_context=resume_context,
            job_description=job_description,
            company_name=req.company_name,
            recipient_name=req.recipient_name,
            tone=req.tone or "professional",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini Cover Letter generation failed: {str(e)}",
        )

    return CoverLetterResponse(
        cover_letter=result.cover_letter,
        subject_line=result.subject_line,
        key_strengths_highlighted=result.key_strengths_highlighted,
        tone_used=req.tone or "professional",
        company_name=req.company_name,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

@app.post(
    "/api/interview-prep",
    response_model=InterviewPrepResponse,
    status_code=status.HTTP_200_OK,
    tags=["Career Acceleration"],
    summary="Generate tailored interview prep kit with STAR answers",
)
def generate_interview_prep_endpoint(
    req: InterviewPrepRequest,
    db: Session = Depends(get_db),
):
    """
    Generates tailored behavioral STAR questions, deep technical questions,
    and gap mitigation strategies based on the candidate's exact profile and job specs.
    """
    resume_context = ""
    job_description = ""
    matched_skills = []
    missing_keywords = []

    if req.analysis_id is not None:
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == req.analysis_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID {req.analysis_id} not found.",
            )
        job_description = req.job_description or record.job_description
        matched_skills = json.loads(record.matched_skills) if isinstance(record.matched_skills, str) else record.matched_skills
        missing_keywords = json.loads(record.missing_keywords) if isinstance(record.missing_keywords, str) else record.missing_keywords
        bullets = json.loads(record.improved_bullets) if isinstance(record.improved_bullets, str) else record.improved_bullets
        feedback = json.loads(record.section_feedback) if isinstance(record.section_feedback, str) else record.section_feedback

        resume_context = req.resume_text or (
            f"Resume File: {record.filename}\n"
            f"ATS Score: {record.ats_score}/100\n"
            f"Candidate Core Strengths:\n" + "\n".join(f"- {b}" for b in bullets) + "\n"
            f"Section Evaluation: {feedback.get('experience', '')}"
        )
    else:
        if not req.resume_text or not req.resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'analysis_id' or 'resume_text' must be provided.",
            )
        if not req.job_description or not req.job_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description cannot be empty. Please provide the target job description.",
            )
        resume_context = req.resume_text.strip()
        job_description = req.job_description.strip()

    try:
        result = generate_interview_prep_with_gemini(
            resume_context=resume_context,
            job_description=job_description,
            matched_skills=matched_skills,
            missing_keywords=missing_keywords,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini Interview Prep generation failed: {str(e)}",
        )

    return InterviewPrepResponse(
        role_summary=result.role_summary,
        behavioral_questions=result.behavioral_questions,
        technical_questions=result.technical_questions,
        gap_mitigation_questions=result.gap_mitigation_questions,
        questions_to_ask_employer=result.questions_to_ask_employer,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

@app.post(
    "/api/coach",
    response_model=CoachChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["Career Acceleration"],
    summary="Interactive multi-turn AI career coaching powered by Gemini Interactions API",
)
def chat_with_coach_endpoint(
    req: CoachChatRequest,
    db: Session = Depends(get_db),
):
    """
    Enables conversational, multi-turn AI resume and interview coaching.
    Uses Gemini Interactions API previous_interaction_id to maintain state.
    """
    cleaned_msg = req.message.strip()
    if not cleaned_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    context_prompt = None
    if not req.previous_interaction_id and req.analysis_id is not None:
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == req.analysis_id).first()
        if record:
            matched = json.loads(record.matched_skills) if isinstance(record.matched_skills, str) else record.matched_skills
            missing = json.loads(record.missing_keywords) if isinstance(record.missing_keywords, str) else record.missing_keywords
            context_prompt = (
                f"Candidate Context:\n"
                f"- Resume File: {record.filename}\n"
                f"- ATS Match Score: {record.ats_score}/100\n"
                f"- Matched Skills: {', '.join(matched)}\n"
                f"- Missing Keywords: {', '.join(missing)}\n"
                f"- Target Job Description Summary: {record.job_description[:600]}..."
            )

    try:
        reply, interaction_id = chat_with_coach_gemini(
            message=cleaned_msg,
            previous_interaction_id=req.previous_interaction_id,
            context_prompt=context_prompt,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini Coach interaction failed: {str(e)}",
        )

    return CoachChatResponse(
        reply=reply,
        interaction_id=interaction_id,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

