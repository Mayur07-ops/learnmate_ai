from sqlalchemy.orm import Session
from .models import User, Topic, Lesson, Question

CONTENT = [
    ("Python", "Python Basics", "Learn variables, types, and expressions.",
     "Variables store values under names. Python infers types at runtime. Use descriptive names and convert input explicitly when needed.",
     [
      ("Which symbol starts a single-line comment in Python?", "#", "//", "<!--", "/*", "A", "Python uses # for single-line comments."),
      ("What is the type of 3.0?", "int", "float", "str", "bool", "B", "A number with a decimal point is a float."),
      ("Which collection is ordered and mutable?", "tuple", "set", "list", "frozenset", "C", "Lists preserve order and can be changed."),
      ("Which keyword defines a function?", "func", "define", "lambda only", "def", "D", "Use def to define a named function.")
     ]),
    ("Python", "Loops and Functions", "Repeat actions and organize reusable code.",
     "A for loop iterates over items. A function groups reusable logic and can accept parameters and return a result.",
     [
      ("Which keyword returns a value from a function?", "yield", "return", "send", "break", "B", "return sends a result back to the caller."),
      ("What does range(3) produce?", "1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3 only", "B", "range(3) yields 0, 1, and 2."),
      ("Which statement skips to the next loop iteration?", "pass", "stop", "continue", "exit", "C", "continue skips the remainder of the current iteration."),
      ("A function with no explicit return returns:", "None", "0", "False", "An error", "A", "Python functions return None by default.")
     ]),
    ("Mathematics", "Algebra Foundations", "Work with variables and simple equations.",
     "An equation states that two expressions are equal. Apply the same operation to both sides to preserve equality.",
     [
      ("Solve x + 4 = 9.", "3", "4", "5", "13", "C", "Subtract 4 from both sides: x = 5."),
      ("Simplify 3x + 2x.", "5", "5x", "6x", "x", "B", "Like terms combine: 3x + 2x = 5x."),
      ("If y = 2x and x = 6, y equals:", "3", "8", "10", "12", "D", "Substitute x = 6: y = 2 × 6 = 12."),
      ("Which is a prime number?", "9", "15", "17", "21", "C", "17 has exactly two positive divisors.")
     ]),
    ("Computer Science", "SQL Basics", "Retrieve and filter data from relational tables.",
     "SELECT chooses columns, FROM names the table, and WHERE filters rows. Use parameterized queries in application code.",
     [
      ("Which SQL command retrieves rows?", "GET", "SELECT", "OPEN", "FETCH ALL", "B", "SELECT is used to query data."),
      ("Which clause filters rows before grouping?", "ORDER BY", "HAVING", "WHERE", "LIMIT", "C", "WHERE filters individual rows."),
      ("Which key uniquely identifies a row?", "Foreign key", "Primary key", "Index only", "View", "B", "A primary key uniquely identifies each row."),
      ("Which aggregate counts rows?", "SUM(*)", "TOTAL()", "COUNT(*)", "ROWS()", "C", "COUNT(*) counts rows.")
     ])
]

def seed(db: Session):
    if db.query(User).count() == 0:
        db.add(User(id=1, name="Demo Student", preferred_language="English"))
        db.commit()
    if db.query(Topic).count() > 0:
        return
    for subject, name, description, lesson_text, questions in CONTENT:
        topic = Topic(subject=subject, name=name, description=description)
        db.add(topic)
        db.flush()
        db.add(Lesson(topic_id=topic.id, title=f"{name}: quick lesson", content=lesson_text, estimated_minutes=10))
        for prompt, a, b, c, d, correct, explanation in questions:
            db.add(Question(topic_id=topic.id, prompt=prompt, option_a=a, option_b=b,
                            option_c=c, option_d=d, correct_option=correct,
                            explanation=explanation, difficulty="Beginner"))
    db.commit()
