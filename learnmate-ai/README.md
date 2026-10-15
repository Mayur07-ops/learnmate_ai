# LearnMate AI — Personalized Learning Agent

A college-project MVP for SDG 4: Quality Education. Includes a React + TypeScript + Vite frontend and a FastAPI + SQLite backend, topic-based quiz scoring, rule-based learning recommendations, progress analytics, and a demo tutor with curated responses. An LLM can be added later without changing the core workflow.

## Requirements
- Python 3.10+
- Node.js 18+

## Run the backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## Run the frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Demo flow
1. Open the app and use the demo student profile.
2. Take a quiz and submit answers.
3. View topic-level results and recommendations.
4. Ask the tutor a question.
5. Refresh the dashboard to see saved progress.

## Notes
- The backend seeds original sample questions and lessons on first launch.
- This MVP uses a demo student ID for ease of evaluation; it is not production authentication.
- The tutor is a curated fallback, not a connected LLM. Add an LLM API behind the backend before deploying publicly.
- Do not use the demo as a high-stakes assessment system.


## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting the frontend and backend separately.
