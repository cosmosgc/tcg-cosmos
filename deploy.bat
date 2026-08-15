@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  TCG Cosmos deploy: build frontend + clear cache
echo ============================================

echo [1/2] Building frontend assets...
call npm run build
if errorlevel 1 (
    echo Build failed.
    exit /b 1
)

echo [2/2] Clearing Laravel config cache...
call php artisan config:clear
if errorlevel 1 (
    echo Config clear failed.
    exit /b 1
)

echo.
echo Done. The app is served from http://177.190.68.79:3000/tcg-cosmos/public/
echo Note: uploaded card art uses APP_URL in .env; set it to your server origin
echo and re-run "php artisan config:clear" if images show as broken.
endlocal