@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Iniciando Editor Pro 2
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

REM Verificar si npm esta disponible
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta disponible
    echo Por favor, reinstala Node.js
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm disponible: v%%i
echo.

REM Verificar si las dependencias estan instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias (primera vez)...
    echo Esto puede tomar varios minutos...
    echo.
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo [ERROR] Fallo al instalar dependencias
        echo.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [OK] Directorio node_modules detectado
    echo [INFO] Verificando integridad de dependencias...
    call npm ci --silent
    echo.
)

echo [OK] Dependencias listas
echo.

REM Crear archivo .env si no existe
if not exist ".env" (
    echo [INFO] Creando archivo .env...
    (
        echo # LM Studio Configuration
        echo LM_STUDIO_URL=http://127.0.0.1:1234/v1/chat/completions
        echo LM_STUDIO_MODELS_URL=http://127.0.0.1:1234/v1/models
        echo LM_STUDIO_IMAGES_URL=http://127.0.0.1:1234/v1/images/generations
        echo.
        echo # Ollama Configuration
        echo OLLAMA_URL=http://127.0.0.1:11434/api/generate
        echo OLLAMA_MODELS_URL=http://127.0.0.1:11434/api/tags
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
    ) > .env
    echo [OK] Archivo .env creado
    echo.
)

REM Iniciar el servidor
echo ========================================
echo [INFO] Iniciando servidor...
echo ========================================
echo.
echo.local: http://localhost:3000
echo.
echo Espera a ver el mensaje de servidor iniciado...
echo Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

node server.js

pause
