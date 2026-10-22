# Voxora AI — Render starter

1. Put `server.js` and `package.json` in the root of your GitHub `voxora-ai` repository.
2. Rename your existing frontend HTML file to `index.html` and place it in the same root.
3. On Render, create a **Web Service** from that repository.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. After creation, open **Environment** and add Secret `GEMINI_API_KEY` with your key as the value. Never commit the key to GitHub.
7. Redeploy if needed.

The API endpoint is `POST /api/analyze` using multipart form data:
- `video`: video file (max 12 MB in this starter)
- `language`: `bn`, `en`, or `hi`
- `style`: `shorts`, `gaming`, `storytelling`, `promotional`, `review`, or `informative`

Health check: `/api/health`

Note: the existing frontend must call `/api/analyze` to use this backend. A static HTML prototype that only generates template text will not automatically use this endpoint. Free hosting and AI API limits apply.
