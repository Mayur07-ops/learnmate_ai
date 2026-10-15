# Deploy LearnMate AI (free-tier friendly)

This project is split into a static React frontend and a FastAPI backend. Deploy them separately:
- Frontend: Render Static Site (or Netlify/Vercel)
- Backend: Render Web Service

## 1. Push the project to GitHub
Create a new GitHub repository and upload the contents of this folder. Do not commit `.env` files or API keys.

## 2. Deploy the backend on Render
1. Create a new **Web Service** and connect your repository.
2. Set **Root Directory** to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable `CORS_ORIGINS` temporarily as `http://localhost:5173`.
6. Deploy, then open `https://YOUR-BACKEND.onrender.com/api/health`. Expect `{"status":"healthy"}`.

### Persistent database note
The current MVP uses SQLite. On hosting platforms, local files may be ephemeral unless you attach persistent storage. On Render, attach a persistent disk mounted at `/opt/render/project/src/backend` if your service's working directory is `/opt/render/project/src/backend`, or switch to a managed PostgreSQL database for a more robust deployment. Confirm the actual working directory in your Render service before setting the mount path. Free service availability and disk options can change.

## 3. Deploy the frontend on Render
1. Create a **Static Site** from the same repository.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL` with your backend origin, e.g. `https://YOUR-BACKEND.onrender.com` (do not append `/api`).
6. Deploy the static site and copy its public URL.

## 4. Allow the frontend in backend CORS
Return to the backend Web Service environment settings and set:
`CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com,http://localhost:5173,http://127.0.0.1:5173`

Save changes and redeploy/restart the backend. Use the exact frontend URL shown by the host.

## 5. Smoke test
- `https://YOUR-BACKEND.onrender.com/api/health`
- `https://YOUR-BACKEND.onrender.com/api/dashboard`
- Open the frontend public URL and try lessons, quiz submission, progress, and tutor.

## Important MVP limitations
- This project currently uses a single demo student identity, not real user accounts.
- The tutor is a curated fallback, not an LLM integration.
- Do not use it for real student data until proper authentication, authorization, privacy controls, database persistence, and production hardening are implemented.
- Free hosting instances may sleep and cold-start; the first request can take a while.
