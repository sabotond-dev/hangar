@echo off
rem Starts HANGAR on localhost and opens it in Chrome. Needs Node 20 or newer
rem (https://nodejs.org). Keep this window open while you use the site.
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo HANGAR needs Node.js 20 or newer. Install it from https://nodejs.org and run this again.
  pause
  exit /b 1
)
start "" /b cmd /c "timeout /t 2 /nobreak >nul && (start "" chrome "http://localhost:5173/" || start "" "http://localhost:5173/")"
node serve.mjs
endlocal
