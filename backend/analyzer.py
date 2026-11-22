import json
import os
import re
from typing import List, Optional, Type, TypeVar
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
from schemas import (
    ResumeAnalysis,
    CoverLetterAnalysis,
    CoverLetterResponse,
    InterviewPrepData,
    InterviewPrepResponse,
)

# Ensure .env from backend/.env is loaded
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))

T = TypeVar("T", bound=BaseModel)

def clean_json_string(text: str) -> str:
    """Strip markdown code block fences and trailing commentary if present."""
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Locate the outer JSON braces
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned = cleaned[first_brace : last_brace + 1]
    return cleaned

def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip() or api_key.strip() == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is missing or invalid. Please add your Gemini API key to backend/.env."
        )
    return genai.Client(api_key=api_key.strip())

def get_candidate_models() -> List[str]:
    """Return prioritized modern Gemini models with fallback candidates."""
    preferred_model = os.getenv("GEMINI_MODEL", "gemini-4-hydrogen").strip()
    candidate_models = [
        preferred_model,
        "gemini-4-hydrogen",
        "gemini-4-argon",
        "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
    ]
    deduped = []
    for m in candidate_models:
        if m and m not in deduped:
            deduped.append(m)
    return deduped

def _generate_structured_with_fallback(
    client: genai.Client,
    prompt: str,
    schema_class: Type[T],
    temperature: float = 0.2,
) -> T:
    """
    Executes structured JSON generation using the modern Gemini Interactions API,
    falling back to GenerateContent if needed.
    """
    models_to_try = get_candidate_models()
    last_error = None

    for model_name in models_to_try:
        # First attempt: modern Interactions API with response_format
        try:
            interaction = client.interactions.create(
                model=model_name,
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": schema_class.model_json_schema(),
                },
            )
            raw_text = interaction.output_text or ""
            clean_text = clean_json_string(raw_text)
            return schema_class.model_validate_json(clean_text)
        except Exception as e_interaction:
            last_error = e_interaction
            # Fallback attempt: client.models.generate_content with response_schema
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema_class,
                        temperature=temperature,
                    ),
                )
                raw_text = response.text or ""
                clean_text = clean_json_string(raw_text)
                return schema_class.model_validate_json(clean_text)
            except Exception as e_generate:
                last_error = e_generate
                continue

    raise RuntimeError(
        f"Failed to generate structured response with Gemini API. Last error: {str(last_error)}"
    )

def analyze_resume_with_gemini(resume_text: str, job_description: str) -> ResumeAnalysis:
    client = get_gemini_client()

    prompt = f"""You are an elite Applicant Tracking System (ATS) auditor, hiring manager, and executive resume coach.
Carefully review the provided candidate resume and compare it against the target job description.

Target Job Description:
========================================
{job_description}
========================================

Candidate Resume:
========================================
{resume_text}
========================================

Perform a comprehensive ATS alignment audit and produce structured output containing:
1. `ats_score`: Integer 0-100 indicating match percentage, keyword relevance, skills overlap, and qualification fit.
2. `matched_skills`: A list of key technical and soft skills present in both the resume and the job description.
3. `missing_keywords`: High-priority skills, methodologies, tools, or requirements from the job description that are missing from the resume.
4. `section_feedback`: Specific, actionable critique for:
   - `summary`: Analysis of professional headline, summary, or objective.
   - `experience`: Assessment of work history, bullet point clarity, and demonstrated business impact.
   - `skills`: Critique of technical competencies and skill taxonomy.
   - `formatting`: Evaluation of structural layout, readability, bullet consistency, and ATS friendliness.
5. `improved_bullets`: Exactly 3 rewritten resume bullet points inspired by candidate's actual experience, tailored directly for this job description, utilizing strong action verbs and measurable impact (e.g. Google XYZ formula: Accomplished [X], as measured by [Y], by doing [Z]).
"""

    return _generate_structured_with_fallback(client, prompt, ResumeAnalysis, temperature=0.2)

def generate_cover_letter_with_gemini(
    resume_context: str,
    job_description: str,
    company_name: Optional[str] = None,
    recipient_name: Optional[str] = None,
    tone: str = "professional",
) -> CoverLetterAnalysis:
    client = get_gemini_client()

    company_spec = f"Target Organization / Company: {company_name}\n" if company_name else ""
    recipient_spec = f"Hiring Manager / Recruiter: {recipient_name}\n" if recipient_name else ""

    prompt = f"""You are a master executive copywriter and senior career strategist.
Generate an authentic, highly persuasive, tailored cover letter for a candidate based on their verified background and target job description.

{company_spec}{recipient_spec}Target Tone: {tone}

Target Job Description:
========================================
{job_description}
========================================

Candidate Profile / Resume Context:
========================================
{resume_context}
========================================

Writing Guidelines:
- Open with a compelling hook showing genuine interest in the company/mission and alignment with the role.
- Highlight 2-3 of the candidate's strongest quantified accomplishments directly addressing core requirements from the job description.
- Tactfully bridge any gaps by showcasing quick-learning ability and transferable expertise.
- Maintain a genuine {tone} tone without generic corporate clichés or boilerplate fillers.
- Include a strong, professional call to action.
- Return structured JSON matching the CoverLetterAnalysis schema:
  - `cover_letter`: The full text of the letter.
  - `subject_line`: A high-open email subject line or document heading.
  - `key_strengths_highlighted`: Array of candidate strengths spotlighted in the letter.
"""

    return _generate_structured_with_fallback(client, prompt, CoverLetterAnalysis, temperature=0.3)

def generate_interview_prep_with_gemini(
    resume_context: str,
    job_description: str,
    matched_skills: Optional[List[str]] = None,
    missing_keywords: Optional[List[str]] = None,
) -> InterviewPrepData:
    client = get_gemini_client()

    matched_spec = f"Identified Matched Skills: {', '.join(matched_skills)}\n" if matched_skills else ""
    missing_spec = f"Identified Missing / Gap Keywords: {', '.join(missing_keywords)}\n" if missing_keywords else ""

    prompt = f"""You are a senior hiring director and elite technical interview coach.
Generate a comprehensive, high-yield interview preparation kit for a candidate applying for the target role based on their resume background.

Target Job Description:
========================================
{job_description}
========================================

Candidate Resume Context:
========================================
{resume_context}
========================================
{matched_spec}{missing_spec}

Prepare:
1. `role_summary`: Concise summary of what interviewers will scrutinize and how well the candidate aligns.
2. `behavioral_questions`: Exactly 3 STAR behavioral questions directly relevant to candidate's stated background, with focus competency and step-by-step STAR (Situation, Task, Action, Result) guidance.
3. `technical_questions`: Exactly 3 deep technical or scenario questions covering matched skills and requirements, with key points to mention.
4. `gap_mitigation_questions`: Exactly 2 tough questions probing missing keywords or experience gaps, with an effective strategy for reframing and highlighting transferable capabilities.
5. `questions_to_ask_employer`: Exactly 3 thoughtful, strategic questions for the candidate to ask the interview team that demonstrate deep domain curiosity.
"""

    return _generate_structured_with_fallback(client, prompt, InterviewPrepData, temperature=0.3)

def chat_with_coach_gemini(
    message: str,
    previous_interaction_id: Optional[str] = None,
    context_prompt: Optional[str] = None,
) -> tuple[str, str]:
    """
    Maintains a multi-turn, stateful conversation with Gemini Interactions API.
    Returns (reply_text, interaction_id).
    """
    client = get_gemini_client()
    models_to_try = get_candidate_models()
    system_instruction = (
        "You are an elite AI Career Coach and Resume Strategist. "
        "You provide actionable, concise, empowering, and specific advice regarding "
        "resume optimization, ATS alignment, interview tactics, and career progression. "
        "Format responses clearly with bullet points where appropriate."
    )

    last_error = None
    for model_name in models_to_try:
        try:
            if previous_interaction_id:
                # Stateful continuation using Gemini Interactions API
                interaction = client.interactions.create(
                    model=model_name,
                    input=message,
                    previous_interaction_id=previous_interaction_id,
                )
            else:
                # First turn with context
                user_input = message
                if context_prompt:
                    user_input = f"{context_prompt}\n\nCandidate Question: {message}"

                interaction = client.interactions.create(
                    model=model_name,
                    input=user_input,
                    system_instruction=system_instruction,
                )

            reply = interaction.output_text or ""
            return reply, interaction.id
        except Exception as e_interact:
            last_error = e_interact
            continue

    raise RuntimeError(
        f"Failed to communicate with Gemini Coach. Last error: {str(last_error)}"
    )
