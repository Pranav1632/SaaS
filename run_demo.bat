@echo off
echo ========================================================
echo        STARTING SAANSAI v2 DEMO PLATFORM
echo   Hyperlocal Air Exposure Intelligence (Pune / PCCOE)
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "SaansAI Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Next.js 15 Frontend on http://localhost:3000 ...
start "SaansAI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo Opening SaansAI Dashboard in your default browser...
start http://localhost:3000
start http://localhost:8000/docs

echo ========================================================
echo   SaansAI is running!
echo   Frontend: http://localhost:3000
echo   Backend Docs: http://localhost:8000/docs
echo ========================================================
