# NCHU Study Assistant

React + TypeScript + Vite app for checking NCHU transcript courses against graduation and program requirements.

## Run Locally

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## Build

```powershell
npm run build
```

## Public Production Hosting on Netlify

GitHub Pages cannot run the AI features because it only hosts static files. Netlify can host the React app and run the `/api/nchu/*` serverless functions.

1. Create a Groq API key in the Groq Console.
2. Push this project to GitHub.
3. In Netlify, create a new site from that GitHub repo.
4. Use these build settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

5. In Netlify site settings, add environment variables:

```text
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3-32b
```

6. Deploy.

The frontend calls `/api/nchu/*`. Netlify redirects those requests to `netlify/functions/nchu.mjs`, where the Groq key stays private.

If the free Groq quota is reached, the chat shows a graceful error without exposing the API key.

## Docker Hosting

The project can also run as a Node server with Docker if you later choose a VPS:

```bash
cp .env.production.example .env
docker compose up -d --build
```

## Current Scope

- Import copied content from 學生歷年成績查詢.
- Calculate 外國語文學系 and 機械工程學系（114學年度起入學）graduation progress for supported rules.
- Track general education, professional, external-credit, PE/service-learning, repeated-course, failed, and withdrawn-course rules.
- Track 數位人文與資訊應用學程 progress.
- Export the course table as plain text.
