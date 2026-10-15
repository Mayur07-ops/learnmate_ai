from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), default="Demo Student")
    preferred_language: Mapped[str] = mapped_column(String(20), default="English")

class Topic(Base):
    __tablename__ = "topics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="topic", cascade="all, delete-orphan")
    questions: Mapped[list["Question"]] = relationship(back_populates="topic", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"))
    title: Mapped[str] = mapped_column(String(150))
    content: Mapped[str] = mapped_column(Text)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=10)
    topic: Mapped["Topic"] = relationship(back_populates="lessons")

class Question(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"))
    prompt: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(String(250))
    option_b: Mapped[str] = mapped_column(String(250))
    option_c: Mapped[str] = mapped_column(String(250))
    option_d: Mapped[str] = mapped_column(String(250))
    correct_option: Mapped[str] = mapped_column(String(1))
    explanation: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), default="Beginner")
    topic: Mapped["Topic"] = relationship(back_populates="questions")

class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), default=1)
    score: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(String(80))
    answers_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), default=1)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    completed: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
