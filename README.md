# Nocturnal Pro Editor & Player

A modern, web-based code editor and video player with integrated AI chat and public video feed capabilities.

## Features
- **Full-featured Editor:** File navigation, syntax highlighting, and terminal integration.
- **AI Chat:** Integrated AI chat with history persistence.
- **Nocturnal Player:** Supports HLS (.m3u8), MP4, WebM, and YouTube.
- **Public Feed:** Share and watch videos with the community.
- **Secure by Design:** Path traversal protection and password-protected administrative actions in production.
- **Render Ready:** Optimized for deployment with detailed guides included.

## Quick Start
1. Install dependencies: `npm install`
2. Start the server: `npm start` (runs `server-v2.js`)
3. Open `http://localhost:3000`

## Deployment
See `docs/RENDER_SPEC.md` for detailed instructions on deploying to Render. Remember to set the **Root Directory** if you are deploying from a subfolder.

## Security
In production (`NODE_ENV=production`), certain actions require an `ADMIN_PASSWORD`. Default: `nocturnal-admin`. Change this in your `.env` file.
