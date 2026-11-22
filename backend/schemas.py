from pydantic import BaseModel, Field
from typing import List, Optional

class SectionFeedback(BaseModel):
    summary: str = Field(description="Constructive critique and feedback on the candidate's summary/objective.")
    experience: str = Field(description="Critique on work experience descriptions, achievements, and impact.")
    skills: str = Field(description="Critique on how well the candidate's skills align with the target job requirements.")
    formatting: str = Field(description="Critique on layout, readability, bullet consistency, and ATS scannability.")

class ResumeAnalysis(BaseModel):
    ats_score: int = Field(ge=0, le=100, description="ATS match score from 0 to 100.")
    matched_skills: List[str] = Field(description="Skills and competencies matched between resume and job description.")
    missing_keywords: List[str] = Field(description="Important keywords, technologies, or requirements from the job description absent in the resume.")
    section_feedback: SectionFeedback = Field(description="Section-by-section breakdown of feedback.")
    improved_bullets: List[str] = Field(description="List of exactly 3 rewritten, high-impact bullet points demonstrating strong action verbs and quantifiable results.")

class AnalysisResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    ats_score: int
    matched_skills: List[str]
    missing_keywords: List[str]
    section_feedback: SectionFeedback
    improved_bullets: List[str]
    created_at: str

class AnalysisHistoryItem(BaseModel):
    id: int
    filename: str
    file_type: str
    job_description: str
    ats_score: int
    matched_skills: List[str]
    missing_keywords: List[str]
    section_feedback: SectionFeedback
    improved_bullets: List[str]
    created_at: str

class DeleteResponse(BaseModel):
    message: str
    id: int

# ==================== Cover Letter Schemas ====================

class CoverLetterRequest(BaseModel):
    analysis_id: Optional[int] = Field(None, description="Optional ID of a saved analysis to pull resume and job description context from.")
    resume_text: Optional[str] = Field(None, description="Raw resume text if not using analysis_id.")
    job_description: Optional[str] = Field(None, description="Target job description if not using analysis_id.")
    company_name: Optional[str] = Field(None, description="Target company or organization name.")
    recipient_name: Optional[str] = Field(None, description="Hiring manager or recruiter name if known.")
    tone: Optional[str] = Field("professional", description="Tone of the letter: professional, executive, conversational, or technical.")

class CoverLetterAnalysis(BaseModel):
    cover_letter: str = Field(description="The full, tailored cover letter text.")
    subject_line: str = Field(description="Recommended email subject line or document heading.")
    key_strengths_highlighted: List[str] = Field(description="List of core candidate strengths and accomplishments spotlighted in the letter.")

class CoverLetterResponse(BaseModel):
    cover_letter: str
    subject_line: str
    key_strengths_highlighted: List[str]
    tone_used: str
    company_name: Optional[str] = None
    created_at: str

# ==================== Interview Prep Schemas ====================

class BehavioralQuestion(BaseModel):
    question: str = Field(description="The behavioral interview question.")
    focus_competency: str = Field(description="The competency evaluated (e.g., Leadership, Adaptability, Technical Conflict).")
    star_guidance: str = Field(description="Actionable guidance on structuring a STAR-format response using actual resume accomplishments.")

class TechnicalQuestion(BaseModel):
    question: str = Field(description="Technical interview question or scenario.")
    skill_targeted: str = Field(description="The technical skill or tooling targeted.")
    key_points_to_mention: List[str] = Field(description="Key technical terms and concepts to include in the answer.")

class GapQuestion(BaseModel):
    potential_concern: str = Field(description="The potential resume gap or missing skill from the job requirements.")
    question: str = Field(description="How an interviewer might probe this gap.")
    recommended_strategy: str = Field(description="Recommended framing strategy to pivot to transferable skills and demonstrated agility.")

class InterviewPrepData(BaseModel):
    role_summary: str = Field(description="Executive summary of the target role expectations and candidate fit.")
    behavioral_questions: List[BehavioralQuestion] = Field(description="Behavioral interview questions tailored to candidate's background.")
    technical_questions: List[TechnicalQuestion] = Field(description="Technical questions based on matched skills and required stack.")
    gap_mitigation_questions: List[GapQuestion] = Field(description="Questions addressing potential gaps with winning strategies.")
    questions_to_ask_employer: List[str] = Field(description="High-value questions for the candidate to ask the interviewers.")

class InterviewPrepRequest(BaseModel):
    analysis_id: Optional[int] = Field(None, description="Optional ID of a saved analysis to use as context.")
    resume_text: Optional[str] = Field(None, description="Raw resume text if not using analysis_id.")
    job_description: Optional[str] = Field(None, description="Target job description if not using analysis_id.")

class InterviewPrepResponse(BaseModel):
    role_summary: str
    behavioral_questions: List[BehavioralQuestion]
    technical_questions: List[TechnicalQuestion]
    gap_mitigation_questions: List[GapQuestion]
    questions_to_ask_employer: List[str]
    created_at: str

# ==================== Interactive Resume Coach Schemas ====================

class CoachChatRequest(BaseModel):
    message: str = Field(..., description="Candidate's question or prompt for the resume coach.")
    analysis_id: Optional[int] = Field(None, description="Optional analysis ID to provide initial context.")
    previous_interaction_id: Optional[str] = Field(None, description="Previous Gemini interaction ID for stateful multi-turn conversation.")

class CoachChatResponse(BaseModel):
    reply: str = Field(description="AI Career Coach response.")
    interaction_id: str = Field(description="Gemini interaction ID to pass in subsequent turns for context continuity.")
    created_at: str = Field(description="Timestamp of the message.")
