@echo off
setlocal

set "BACKEND_DIR=%~dp0backend"
set "FRONTEND_DIR=%~dp0frontend"
if not defined WORDHIPPO_DIR set "WORDHIPPO_DIR=%USERPROFILE%\wordhippo-discord-bot"

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm.cmd was not found. Install Node.js and ensure it is on PATH.
    pause
    exit /b 1
)

for %%D in ("%BACKEND_DIR%" "%FRONTEND_DIR%" "%WORDHIPPO_DIR%") do (
    if not exist "%%~D\package.json" (
        echo ERROR: Project not found at "%%~D".
        echo Set WORDHIPPO_DIR if the WordHippo project is in a different location.
        pause
        exit /b 1
    )
    if not exist "%%~D\node_modules\" (
        echo ERROR: Dependencies are missing in "%%~D".
        echo Run npm.cmd install in that project before starting.
        pause
        exit /b 1
    )
)

echo Start WampServer and its database service before using the notes app.
echo Opening three windows. Check each window for startup errors.
start "Notes backend" /d "%BACKEND_DIR%" cmd /k "npm.cmd run dev"
start "Notes frontend" /d "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"
start "WordHippo bot" /d "%WORDHIPPO_DIR%" cmd /k "npm.cmd start"
echo Dashboard: http://localhost:3000
echo WordHippo dashboard: http://localhost:3102
endlocal
