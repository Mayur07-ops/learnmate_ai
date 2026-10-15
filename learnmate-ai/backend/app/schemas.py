from pydantic import BaseModel, Field
from typing import Dict

class SubmitQuiz(BaseModel):
    answers: Dict[int, str] = Field(default_factory=dict)

class TutorQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    language: str = "English"
    topic: str | None = None
