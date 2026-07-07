@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Iniciando Editor Pro 2 (v2.1)
echo ========================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo.
    echo Descarga Node.js desde: https://nodejs.org/
    echo Recomendado: v18.0.0 o superior
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js detectado: %NODE_VERSION%
echo.

REM Verificar si las dependencias estan instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install --legacy-peer-deps --ignore-scripts
)

REM Iniciar el servidor
echo ========================================
echo [INFO] Iniciando servidor...
echo ========================================
echo.
echo.local: http://localhost:3000
echo.
echo ========================================
echo.

node server-v2.js

pause
