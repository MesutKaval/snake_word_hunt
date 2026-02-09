@echo off
echo ========================================
echo   Snake Word Hunt - Start Game
echo ========================================
echo.
echo Starting game...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please install Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Start local server and open browser
echo Starting local server (Port 8000)...
echo.
echo The game will open in your browser...
echo You can close this window to stop the game.
echo.

REM Open browser (wait 1 second)
timeout /t 1 /nobreak >nul
start http://localhost:8000

REM Start Python HTTP server
python -m http.server 8000
