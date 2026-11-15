@echo off
cd /d "%~dp0"
py -m pip install -r requirements.txt
if errorlevel 1 (
  echo Error installing Python packages.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:8080 in Chrome
py -m uvicorn sitelight.main:app --host 127.0.0.1 --port 8080
pause
