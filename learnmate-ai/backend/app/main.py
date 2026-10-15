import json
from collections import defaultdict
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from .database import Base, engine, get_db
from .models import User, Topic, Lesson, Question, Attempt, LessonProgress
from .schemas import SubmitQuiz, TutorQuestion
from .seed import seed

Base.metadata.create_all(bind=engine)
with __import__("contextlib").suppress(Exception):
    with next(get_db()) as db:
        seed(db)

app = FastAPI(title="LearnMate AI API", version="1.0.0")
import os
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [origin.strip().rstrip("/") for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"name": "LearnMate AI API", "docs": "/docs", "status": "ok"}

@app.get("/api/subjects")
def subjects(db: Session = Depends(get_db)):
    topics = db.query(Topic).all()
    return [{"subject": s, "topics": [{"id": t.id, "name": t.name, "description": t.description}
             for t in topics if t.subject == s]} for s in sorted({t.subject for t in topics})]

@app.get("/api/lessons")
def lessons(db: Session = Depends(get_db)):
    rows = db.query(Lesson).options(joinedload(Lesson.topic)).all()
    return [{"id": l.id, "title": l.title, "content": l.content, "estimated_minutes": l.estimated_minutes,
             "topic_id": l.topic_id, "topic": l.topic.name, "subject": l.topic.subject} for l in rows]

@app.post("/api/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    row = db.query(LessonProgress).filter_by(user_id=1, lesson_id=lesson_id).first()
    if not row:
        db.add(LessonProgress(user_id=1, lesson_id=lesson_id, completed=True))
        db.commit()
    return {"ok": True, "message": "Lesson marked complete"}

@app.get("/api/quiz")
def get_quiz(subject: str | None = None, limit: int = 8, db: Session = Depends(get_db)):
    q = db.query(Question).options(joinedload(Question.topic))
    if subject:
        q = q.join(Topic).filter(Topic.subject == subject)
    rows = q.order_by(Question.id).limit(max(1, min(limit, 20))).all()
    return [{"id": x.id, "prompt": x.prompt, "options": {"A": x.option_a, "B": x.option_b, "C": x.option_c, "D": x.option_d},
             "topic": x.topic.name, "subject": x.topic.subject, "difficulty": x.difficulty} for x in rows]

@app.post("/api/quiz/submit")
def submit_quiz(payload: SubmitQuiz, db: Session = Depends(get_db)):
    ids = list(payload.answers.keys())
    rows = db.query(Question).options(joinedload(Question.topic)).filter(Question.id.in_(ids)).all()
    if not rows:
        raise HTTPException(400, "No valid answers were submitted")
    correct = 0
    topic_stats = defaultdict(lambda: {"correct": 0, "total": 0})
    review = []
    subjects = set()
    for q in rows:
        answer = payload.answers.get(q.id, "").upper()
        ok = answer == q.correct_option
        correct += int(ok)
        topic_stats[q.topic.name]["correct"] += int(ok)
        topic_stats[q.topic.name]["total"] += 1
        subjects.add(q.topic.subject)
        review.append({"id": q.id, "prompt": q.prompt, "selected": answer, "correct_option": q.correct_option,
                       "is_correct": ok, "explanation": q.explanation, "topic": q.topic.name})
    attempt = Attempt(user_id=1, score=correct, total=len(rows), subject=", ".join(sorted(subjects)),
                      answers_json=json.dumps(payload.answers))
    db.add(attempt)
    db.commit()
    return {"attempt_id": attempt.id, "score": correct, "total": len(rows),
            "accuracy": round(correct / len(rows) * 100, 1),
            "topic_stats": [{"topic": name, "correct": v["correct"], "total": v["total"],
                             "accuracy": round(v["correct"] / v["total"] * 100, 1)}
                            for name, v in topic_stats.items()],
            "review": review}

def get_topic_performance(db: Session):
    stats = defaultdict(lambda: {"correct": 0, "total": 0})
    attempts = db.query(Attempt).filter_by(user_id=1).order_by(Attempt.id).all()
    for attempt in attempts:
        answers = json.loads(attempt.answers_json or "{}")
        for qid, answer in answers.items():
            q = db.get(Question, int(qid))
            if q:
                stats[q.topic.name]["total"] += 1
                stats[q.topic.name]["correct"] += int(answer.upper() == q.correct_option)
    return stats

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    attempts = db.query(Attempt).filter_by(user_id=1).order_by(desc(Attempt.created_at)).all()
    topics = db.query(Topic).all()
    performance = get_topic_performance(db)
    completed = db.query(LessonProgress).filter_by(user_id=1, completed=True).count()
    topic_data = []
    for t in topics:
        v = performance.get(t.name, {"correct": 0, "total": 0})
        accuracy = round(v["correct"] / v["total"] * 100, 1) if v["total"] else None
        topic_data.append({"topic": t.name, "subject": t.subject, "accuracy": accuracy,
                           "attempted": v["total"], "correct": v["correct"]})
    attempted_topics = [t for t in topic_data if t["accuracy"] is not None]
    weak = sorted(attempted_topics, key=lambda x: x["accuracy"])
    recommendations = []
    for t in topic_data:
        if t["accuracy"] is None:
            recommendations.append({"topic": t["topic"], "reason": "Start with a diagnostic quiz to establish your baseline.", "priority": "Start"})
        elif t["accuracy"] < 50:
            recommendations.append({"topic": t["topic"], "reason": "Review the foundational lesson, then retry practice questions.", "priority": "High"})
        elif t["accuracy"] < 75:
            recommendations.append({"topic": t["topic"], "reason": "Practice targeted exercises to strengthen this concept.", "priority": "Medium"})
        else:
            recommendations.append({"topic": t["topic"], "reason": "Try a harder quiz or move to the next topic.", "priority": "Next"})
    scored = sum(a.score for a in attempts)
    total = sum(a.total for a in attempts)
    return {"student": {"name": "Demo Student", "language": "English"},
            "average_accuracy": round(scored / total * 100, 1) if total else 0,
            "quizzes_taken": len(attempts), "questions_answered": total, "lessons_completed": completed,
            "topic_performance": topic_data, "recommendations": recommendations,
            "recent_attempts": [{"id": a.id, "score": a.score, "total": a.total, "subject": a.subject,
                                 "date": a.created_at.isoformat() if a.created_at else None} for a in attempts[:6]],
            "weakest_topic": weak[0]["topic"] if weak else None}

@app.post("/api/tutor")
def tutor(payload: TutorQuestion):
    text = payload.question.lower()
    responses = [
      (["variable", "assignment", "store a value"], "A variable is a name that refers to a value. Example: `score = 10` stores the number 10 under the name `score`. Try changing the value and printing it."),
      (["loop", "for loop", "iteration"], "A loop repeats code. In Python, `for item in items:` visits each item. Example: `for n in range(3): print(n)` prints 0, 1, and 2."),
      (["function", "def "], "A function is reusable code. Define it with `def`, accept inputs as parameters, and use `return` to send a result back. Example: `def double(x): return x * 2`."),
      (["sql", "select"], "SQL `SELECT` retrieves data from a table. Example: `SELECT name FROM students WHERE score >= 70;` returns names for rows meeting the condition."),
      (["equation", "algebra", "solve"], "To solve an equation, keep both sides balanced. For `x + 4 = 9`, subtract 4 from both sides to get `x = 5`."),
      (["study", "plan", "learn"], "Use a short cycle: learn one concept, solve 3–5 questions without looking at notes, review mistakes, then retest later. Focus first on topics where your accuracy is lowest.")
    ]
    for keys, answer in responses:
        if any(k in text for k in keys):
            if payload.language.lower().startswith("hindi"):
                return {"answer": "यह डेमो ट्यूटर उत्तर है: " + answer, "mode": "curated-demo"}
            return {"answer": answer, "mode": "curated-demo"}
    return {"answer": "Let's break this down. First, tell me which part feels confusing. Review the related lesson, try a small example, and explain what you think the first step should be. I can then help you work through it. (Demo mode: configure an LLM backend for open-ended answers.)",
            "mode": "curated-demo"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}
