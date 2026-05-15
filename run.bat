@echo off
set PORT=5500
echo Starting Vite dev server on http://localhost:%PORT% ...
start "" http://localhost:%PORT%
npm.cmd run dev -- --host 127.0.0.1 --port %PORT% --strictPort
