🚀 GUÍA RÁPIDA: GITHUB → RAILWAY EN 10 MINUTOS

════════════════════════════════════════════════════════════════

## PASO 1: Generar Token de GitHub (2 min)

1. Entra a: https://github.com/settings/tokens
2. Clic "Generate new token (classic)"
3. Configura:
   - Name: "Editor Pro Deploy"
   - Expiration: 90 days
   - Selecciona:
     ✓ repo (acceso completo al repo)
     ✓ workflow
4. Clic "Generate token"
5. **COPIA el token** (solo se muestra una vez)

════════════════════════════════════════════════════════════════

## PASO 2: Subir a GitHub (3 min)

### Opción A: Usar VS Code (RECOMENDADO - más fácil)

1. Abre VS Code
2. Clic en "Source Control" (Ctrl+Shift+G)
3. Clic "Initialize Repository"
4. En el terminal, ejecuta:
   ```
   cd "G:\editor pro2"
   git config --global user.name "ultralinkargentina-sys"
   git config --global user.email "ultralinkargentina@gmail.com"
   git config --global safe.directory "G:/editor pro2"
   git status
   git remote set-url origin https://github.com/arabackup1985-hash/editorpro2.git
   ```
5. Ahora en Source Control:
   - Clic "+" junto a los archivos (o "Stage All")
   - En "Message" escribe: "Initial commit: Editor Pro 2 v2.0"
   - Clic "Commit"
6. Clic "Publish Branch"
   - URL: https://github.com/ultralinkargentina-sys/editorpro2.git
   - Pega el TOKEN de GitHub

### Opción B: Terminal (si prefieres línea de comandos)

1. Abre CMD como administrador
2. Ejecuta:
   ```
   cd G:\editor pro2
   git config --global user.name "Editor Pro"
   git config --global user.email "editor@example.com"
   git config --global safe.directory "G:/editor pro2"
   git init
   git add .
   git commit -m "Initial commit: Editor Pro 2 v2.0 listo para Railway"
   git branch -M main
   git remote add origin https://github.com/ultralinkargentina-sys/editorpro2.git
   git push -u origin main
   ```
3. Cuando pida "Username":
   - Ingresa: **tu nombre de usuario de GitHub**
4. Cuando pida "Password":
   - Ingresa: **tu TOKEN (del Paso 1)**

════════════════════════════════════════════════════════════════

## PASO 3: Conectar Railway (2 min)

1. Ve a https://railway.app
2. Clic "Login"
3. Clic "Continue with GitHub"
4. Autoriza Railway
5. Clic "New Project"
6. Clic "Deploy from GitHub repo"
7. Selecciona tu repositorio:
   - Busca: "editorpro2"
   - Clic en él
8. Clic "Deploy"

Railway empezará a construir tu app automáticamente (2-3 min)

════════════════════════════════════════════════════════════════

## PASO 4: Configurar Variables de Entorno (1 min)

1. Entra a tu proyecto en Railway
2. Clic en "Variables" (en el panel izquierdo)
3. Agrega variables:

   VARIABLE              VALOR
   ─────────────────     ─────────────────────────────────────
   PORT                  3000
   NODE_ENV              production
   LM_STUDIO_URL         http://tu-servidor:1234/v1/chat/completions
   LM_STUDIO_MODELS_URL  http://tu-servidor:1234/v1/models
   OLLAMA_URL            (opcional) http://tu-servidor:11434/api/generate
   OLLAMA_MODELS_URL     (opcional) http://tu-servidor:11434/api/tags

   Reemplaza "tu-servidor" con:
   - IP de tu máquina si tienes LM Studio localmente
   - O el host de tu servidor remoto

4. Clic "Save"
5. Railway redeploya automáticamente

════════════════════════════════════════════════════════════════

## PASO 5: Acceder a tu App (1 min)

1. Entra a tu proyecto en Railway
2. Clic en "Deployments"
3. Ve el URL de tu app:
   https://editor-pro2-production.up.railway.app

4. Abre en navegador y ¡listo!

════════════════════════════════════════════════════════════════

## TROUBLESHOOTING

### "Git no se reconoce"
→ Asegúrate que Git está en el PATH
→ O usa: "C:\Program Files\Git\bin\git.exe"

### "Error al hacer push"
→ Verifica que el token es válido
→ Verifica que el usuario existe
→ Intenta nuevamente con el token

### "Mi app no inicia en Railway"
→ Ve a "Logs" en Railway
→ Lee los errores
→ Asegúrate que PORT=3000 está configurado

### "No puedo conectar a LM Studio"
→ Si está en tu máquina local: Railway no puede acceder
→ Solución: Pon LM Studio en un servidor remoto
→ O usa Railway's internal networking

════════════════════════════════════════════════════════════════

## PRÓXIMOS PASOS

✅ GitHub: Push completado
✅ Railway: App en vivo
✅ Variables: Configuradas

Ahora:
1. Prueba tu app en: https://editor-pro2-production.up.railway.app
2. Abre el chat y verifica que funciona
3. Recarga la página: el chat debe persistir
4. Agrega dominio personalizado (opcional)

════════════════════════════════════════════════════════════════

¿PREGUNTAS?

Lee:
- RAILWAY_DEPLOYMENT.md (guía completa)
- START_HERE.md (información del proyecto)
- RAILWAY_QUICKSTART.md (resumen rápido)

¡Tu app está en vivo! 🎉
