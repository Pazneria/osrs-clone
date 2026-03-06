@echo off
set PORT=5500
echo Starting local server on http://localhost:%PORT% ...
start "" http://localhost:%PORT%
python -m http.server %PORT%
