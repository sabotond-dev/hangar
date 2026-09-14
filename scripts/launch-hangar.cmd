@echo off
rem Launches HANGAR on localhost for the bench: starts the Vite dev server if port 5173
rem is not already answering, waits for it, then opens Chrome on it (Web Serial needs
rem Chromium; localhost is a secure context, so no HTTPS is needed).
setlocal
set "REPO=%~dp0.."
set "URL=http://localhost:5173/"

powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%URL%') | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
  start "HANGAR dev server" /D "%REPO%" cmd /k "npm run dev"
  powershell -NoProfile -Command "$i=0; while ($i -lt 60) { try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 '%URL%') | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 500; $i++ } }; exit 1"
)

start "" chrome "%URL%" || start "" "%URL%"
endlocal
