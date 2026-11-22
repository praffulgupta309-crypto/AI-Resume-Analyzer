import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    job_description = Column(Text, nullable=False)
    ats_score = Column(Integer, nullable=False)
    matched_skills = Column(Text, nullable=False)  # JSON-serialized list of strings
    missing_keywords = Column(Text, nullable=False)  # JSON-serialized list of strings
    section_feedback = Column(Text, nullable=False)  # JSON-serialized dict
    improved_bullets = Column(Text, nullable=False)  # JSON-serialized list of strings
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "job_description": self.job_description,
            "ats_score": self.ats_score,
            "matched_skills": json.loads(self.matched_skills) if isinstance(self.matched_skills, str) else self.matched_skills,
            "missing_keywords": json.loads(self.missing_keywords) if isinstance(self.missing_keywords, str) else self.missing_keywords,
            "section_feedback": json.loads(self.section_feedback) if isinstance(self.section_feedback, str) else self.section_feedback,
            "improved_bullets": json.loads(self.improved_bullets) if isinstance(self.improved_bullets, str) else self.improved_bullets,
            "created_at": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
        }
