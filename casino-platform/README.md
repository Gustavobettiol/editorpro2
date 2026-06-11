# Plataforma de Gambling "Casino Pro"

Este es un sistema full-stack modular para la gestión de juegos de azar, apuestas deportivas y cumplimiento legal.

## 🚀 Tecnologías
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: Next.js 14 + TailwindCSS
- **Infraestructura**: Docker + Redis (Cache/WS)
- **Seguridad**: JWT + bcrypt + Auditable RNG (SHA-256)

## 📁 Estructura
- `backend/`: Servidor NestJS con módulos de auth, user, wallet, sports, casino y compliance.
- `frontend/`: Aplicación Next.js con interfaces reactivas.
- `compliance/`: Reglas de jurisdicción y términos legales.
- `database/`: Migraciones y semillas de base de datos.

## ⚙️ Instalación (Docker)
1. Clonar el repositorio.
2. Ejecutar `docker-compose up --build`.
3. El frontend estará en `http://localhost:3000` y el backend en `http://localhost:3001`.

## ⚖️ Cumplimiento Legal
- **KYC**: Verificación de identidad integrada.
- **RNG**: Generador de números aleatorios con semilla rotativa y hash verificable.
- **Autoexclusión**: Sistema de bloqueo temporal para juego responsable.
- **Geo-blocking**: Middleware basado en jurisdicción (configurado en `compliance/rules.json`).

## 🛠️ Desarrollo Manual
### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---
*Disclaimer: Este software es para propósitos educativos y de demostración. El uso en producción requiere licencias legales correspondientes.*
