@echo off
REM Start SmartCommute backend and frontend concurrently
python "%~dp0run.py"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred while running SmartCommute.
    pause
)
