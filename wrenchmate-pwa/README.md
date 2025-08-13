# WrenchMate (PWA MVP)

Camera-first mechanic helper + project tracker. Ready for free deployment on Vercel.

## Local Dev
```
npm install
npm run dev
```
Open http://localhost:3000

## Deploy (Vercel)
- Push this folder to a GitHub repo
- Import the repo at https://vercel.com/new
- Click Deploy (no extra settings needed)

## PWA
- `public/manifest.json`
- `public/sw.js` is registered in `index.tsx` (via `_app.tsx` load)
- Add to Home Screen on iOS/Android via the browser menu

## Where to customize
- `pages/index.tsx`: UI and logic
- `pages/api/identify.ts`: replace mock with real inference
- `public/icons/*`: replace icons with your Canva designs
