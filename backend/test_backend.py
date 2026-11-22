import io
import json
import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from docx import Document
from pypdf import PdfWriter

# Set test environment
os.environ["GEMINI_API_KEY"] = "test_key_mock"

from main import app
from database import Base, engine, SessionLocal
from models import AnalysisRecord
from schemas import (
    ResumeAnalysis,
    SectionFeedback,
    CoverLetterAnalysis,
    InterviewPrepData,
    BehavioralQuestion,
    TechnicalQuestion,
    GapQuestion,
)

client = TestClient(app)

def create_sample_docx(text: str = "Experienced Software Engineer with Python and FastAPI skills.") -> bytes:
    doc = Document()
    doc.add_heading("John Doe", 0)
    doc.add_paragraph(text)
    doc.add_paragraph("Skills: Python, FastAPI, Docker, SQL, Git")
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()

def create_sample_pdf(text: str = "Software Engineer Resume Python FastAPI Docker PostgreSQL") -> bytes:
    stream = io.BytesIO()
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    raw_pdf = f'''%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length {len(text) + 35} >> stream
BT
/F1 12 Tf
72 712 Td
({text}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000305 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
400
%%EOF
'''.encode('latin-1')
    return raw_pdf

class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        db = SessionLocal()
        db.query(AnalysisRecord).delete()
        db.commit()
        db.close()

    def test_root_endpoint(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["docs_url"], "/docs")
        self.assertIn("cover_letter", data["endpoints"])
        self.assertIn("interview_prep", data["endpoints"])
        self.assertIn("coach", data["endpoints"])

    def test_cors_headers(self):
        response = client.options(
            "/api/analyze",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertIn("access-control-allow-origin", response.headers)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5173")

    def test_unsupported_file_extension(self):
        response = client.post(
            "/api/analyze",
            files={"file": ("resume.txt", b"plain text", "text/plain")},
            data={"job_description": "We need a Python developer."},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])

    def test_empty_job_description(self):
        docx_bytes = create_sample_docx()
        response = client.post(
            "/api/analyze",
            files={"file": ("resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"job_description": "   "},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Job description cannot be empty", response.json()["detail"])

    def test_file_size_limit(self):
        large_bytes = b"0" * (5 * 1024 * 1024 + 100)  # > 5 MB
        response = client.post(
            "/api/analyze",
            files={"file": ("resume.docx", large_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"job_description": "We need a Python developer."},
        )
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds the 5 MB limit", response.json()["detail"])

    @patch("main.analyze_resume_with_gemini")
    def test_analyze_and_history_lifecycle(self, mock_analyze):
        mock_analyze.return_value = ResumeAnalysis(
            ats_score=85,
            matched_skills=["Python", "FastAPI", "SQL", "Docker"],
            missing_keywords=["Kubernetes", "GraphQL", "CI/CD"],
            section_feedback=SectionFeedback(
                summary="Strong overview highlighting backend expertise.",
                experience="Demonstrates good project delivery and engineering discipline.",
                skills="Good alignment with core backend stack, but missing cloud orchestration.",
                formatting="Clean layout and standard bullet points.",
            ),
            improved_bullets=[
                "Architected and deployed 15+ FastAPI microservices, reducing API response latency by 35%.",
                "Streamlined database queries with SQLAlchemy ORM, cutting average query load times by 40%.",
                "Automated CI/CD pipelines using Docker, accelerating feature delivery cycles from bi-weekly to daily.",
            ],
        )

        docx_bytes = create_sample_docx()
        response = client.post(
            "/api/analyze",
            files={"file": ("resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"job_description": "Seeking Python engineer with FastAPI, Docker, and Kubernetes experience."},
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["ats_score"], 85)
        self.assertEqual(len(data["matched_skills"]), 4)
        self.assertEqual(len(data["missing_keywords"]), 3)
        self.assertEqual(len(data["improved_bullets"]), 3)
        self.assertIn("summary", data["section_feedback"])
        self.assertIn("experience", data["section_feedback"])
        self.assertIn("skills", data["section_feedback"])
        self.assertIn("formatting", data["section_feedback"])
        record_id = data["id"]

        # Check GET /api/history
        history_resp = client.get("/api/history")
        self.assertEqual(history_resp.status_code, 200)
        history_list = history_resp.json()
        self.assertEqual(len(history_list), 1)
        self.assertEqual(history_list[0]["id"], record_id)
        self.assertEqual(history_list[0]["ats_score"], 85)

        # Check DELETE /api/history/{id}
        del_resp = client.delete(f"/api/history/{record_id}")
        self.assertEqual(del_resp.status_code, 200)
        self.assertEqual(del_resp.json()["id"], record_id)

        # Check history is now empty
        history_resp2 = client.get("/api/history")
        self.assertEqual(len(history_resp2.json()), 0)

        # Check DELETE on non-existent record returns 404
        del_resp404 = client.delete(f"/api/history/{record_id}")
        self.assertEqual(del_resp404.status_code, 404)

    @patch("main.analyze_resume_with_gemini")
    def test_analyze_with_pdf(self, mock_analyze):
        mock_analyze.return_value = ResumeAnalysis(
            ats_score=92,
            matched_skills=["Python", "FastAPI"],
            missing_keywords=["Docker"],
            section_feedback=SectionFeedback(
                summary="Clear and concise.",
                experience="Strong leadership shown.",
                skills="Highly relevant.",
                formatting="Good formatting.",
            ),
            improved_bullets=[
                "Point 1",
                "Point 2",
                "Point 3",
            ],
        )

        pdf_bytes = create_sample_pdf("Software Engineer Resume Python FastAPI Docker")
        response = client.post(
            "/api/analyze",
            files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
            data={"job_description": "Looking for a Python and FastAPI engineer."},
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["ats_score"], 92)
        self.assertEqual(data["filename"], "resume.pdf")
        self.assertEqual(data["file_type"], "pdf")

    # ==================== Tests for New Gemini Features ====================

    @patch("main.generate_cover_letter_with_gemini")
    def test_cover_letter_endpoint_with_direct_text(self, mock_cover_letter):
        mock_cover_letter.return_value = CoverLetterAnalysis(
            cover_letter="Dear Hiring Team,\n\nI am thrilled to apply for the Senior Python Engineer role...",
            subject_line="Application for Senior Python Engineer - John Doe",
            key_strengths_highlighted=["FastAPI microservice architecture", "SQLAlchemy performance optimization"],
        )

        payload = {
            "resume_text": "Experienced Senior Python Engineer with 6 years building high-throughput FastAPI services.",
            "job_description": "Looking for a Senior Python Engineer experienced in FastAPI and PostgreSQL.",
            "company_name": "Acme Tech",
            "tone": "executive",
        }
        response = client.post("/api/cover-letter", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("Dear Hiring Team", data["cover_letter"])
        self.assertEqual(data["tone_used"], "executive")
        self.assertEqual(data["company_name"], "Acme Tech")
        self.assertEqual(len(data["key_strengths_highlighted"]), 2)

    @patch("main.generate_cover_letter_with_gemini")
    def test_cover_letter_endpoint_with_analysis_id(self, mock_cover_letter):
        mock_cover_letter.return_value = CoverLetterAnalysis(
            cover_letter="Tailored cover letter grounded in analysis record...",
            subject_line="Application for Software Engineer",
            key_strengths_highlighted=["FastAPI", "SQLAlchemy"],
        )

        # Seed an analysis in the DB
        db = SessionLocal()
        record = AnalysisRecord(
            filename="my_resume.pdf",
            file_type="pdf",
            job_description="We need a Python developer.",
            ats_score=88,
            matched_skills=json.dumps(["Python", "FastAPI"]),
            missing_keywords=json.dumps(["Docker"]),
            section_feedback=json.dumps({"summary": "Good", "experience": "Strong", "skills": "Matched", "formatting": "Clean"}),
            improved_bullets=json.dumps(["Bullet 1", "Bullet 2", "Bullet 3"]),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id
        db.close()

        payload = {
            "analysis_id": record_id,
            "company_name": "Google",
            "tone": "professional",
        }
        response = client.post("/api/cover-letter", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["company_name"], "Google")
        self.assertIn("cover_letter", data)

    def test_cover_letter_missing_inputs(self):
        response = client.post("/api/cover-letter", json={})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Either 'analysis_id' or 'resume_text' must be provided", response.json()["detail"])

    @patch("main.generate_interview_prep_with_gemini")
    def test_interview_prep_endpoint(self, mock_prep):
        mock_prep.return_value = InterviewPrepData(
            role_summary="Strong technical fit, candidates should highlight microservices experience.",
            behavioral_questions=[
                BehavioralQuestion(
                    question="Tell me about a time you optimized a slow API endpoint.",
                    focus_competency="Performance Tuning",
                    star_guidance="Describe how you profiled the database query and reduced latency by 35%.",
                )
            ],
            technical_questions=[
                TechnicalQuestion(
                    question="Explain how FastAPI handles async requests compared to Flask.",
                    skill_targeted="FastAPI / Asynchronous Programming",
                    key_points_to_mention=["asyncio event loop", "Uvicorn ASGI", "concurrency vs multithreading"],
                )
            ],
            gap_mitigation_questions=[
                GapQuestion(
                    potential_concern="Lack of extensive Kubernetes production experience.",
                    question="How would you approach container orchestration if required in our stack?",
                    recommended_strategy="Highlight Docker proficiency and self-study in Kubernetes deployments.",
                )
            ],
            questions_to_ask_employer=[
                "What does the deployment pipeline and observability stack look like for this team?"
            ],
        )

        payload = {
            "resume_text": "Backend Engineer with Python, FastAPI, Docker experience.",
            "job_description": "Seeking Backend Engineer proficient in Python, FastAPI, and Kubernetes.",
        }
        response = client.post("/api/interview-prep", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["behavioral_questions"]), 1)
        self.assertEqual(len(data["technical_questions"]), 1)
        self.assertEqual(len(data["gap_mitigation_questions"]), 1)
        self.assertEqual(len(data["questions_to_ask_employer"]), 1)
        self.assertIn("FastAPI", data["technical_questions"][0]["question"])

    @patch("main.chat_with_coach_gemini")
    def test_coach_chat_lifecycle(self, mock_chat):
        mock_chat.return_value = ("To highlight Kubernetes, mention any containerization work you have done.", "interaction-12345")

        # First turn
        payload1 = {
            "message": "How can I improve my bullet points for this job?",
        }
        resp1 = client.post("/api/coach", json=payload1)
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.json()
        self.assertEqual(data1["interaction_id"], "interaction-12345")
        self.assertIn("Kubernetes", data1["reply"])

        # Second turn with previous_interaction_id
        mock_chat.return_value = ("Yes, here is a rewritten bullet point using the XYZ formula.", "interaction-67890")
        payload2 = {
            "message": "Can you give me an example bullet?",
            "previous_interaction_id": "interaction-12345",
        }
        resp2 = client.post("/api/coach", json=payload2)
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertEqual(data2["interaction_id"], "interaction-67890")
        self.assertIn("rewritten bullet", data2["reply"])

    def test_coach_empty_message(self):
        response = client.post("/api/coach", json={"message": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Message cannot be empty", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
