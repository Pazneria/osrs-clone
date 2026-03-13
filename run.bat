@echo off
set PORT=5500
echo Starting Vite dev server on http://localhost:%PORT% ...
start "" http://localhost:%PORT%
npm.cmd run dev
