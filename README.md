# health-buddy
health-budduy-aI
# HealthBuddy AI (Frontend)

Small static frontend for a voice-powered medicine assistant (index.html).  
Red glassmorphism theme, SpeechSynthesis TTS, SpeechRecognition fallback, Agora ASR hooks.

## Quick start (local)
1. Open a terminal in the project folder:
   cd "C:\Users\dell\Desktop\new"
2. Serve the site (recommended — some APIs require a secure origin):
   - With Python:
     py -m http.server 8000
   - Or with Node (if installed):
     npx http-server -p 8000
3. Visit: http://localhost:8000 in your browser.

## Important setup
- Edit `script.js` / `index.html` to set your Agora App ID (if using Agora ASR).  
  Do NOT store production AI keys in client-side files — use a server-side proxy.
- TTS uses browser SpeechSynthesis (voice selector in the UI).
- Voice capture uses Web SpeechRecognition as a fallback. For full Agora ASR, ensure the ASR extension script is loaded.

## Features
- Voice reminders (add + set by voice)
- AI medicine search panel (voice search)
- Medicine image / prescription upload UI
- TTS voice selector + preview
- Transcript export (download + clipboard)

## Troubleshooting
- "ASR Extension script not loaded" — check:
  - Network tab for AgoraRTC_ASR_Extension.js (200 OK, no CORS).
  - Page served over HTTPS for secure-context features.
  - Console for errors; ensure AgoraRTC library is loaded before extension.
  - Use the included `ensureAsrExtensionLoaded()` helper if present.
- SpeechRecognition not available on some browsers (Safari, older Edge). Use Chrome/Edge (Chromium) for best support.
- If voices are missing, wait a few seconds (voices load asynchronously) or try a different browser.

## Notes & next steps
- Add a small server to proxy AI requests (hide keys) — I can scaffold an Express example if you want.
- Can further refine red glassmorphism CSS into `style.css` and optimize accessibility/contrast.

## Files to check
- `index.html` — main UI
- `script.js` — app logic (speech, reminders, AI calls)
- `style.css` — custom styles (glass, accents)

---

If you want, I can:
- add an Express proxy example (Windows-ready),
- generate a short checklist to fix ASR loading with exact console commands,
- or create a dedicated `README-DEV.md` with development tasks.

```// filepath: c:\Users\dell\Desktop\new\README.md
# HealthBuddy AI (Frontend)

Small static frontend for a voice-powered medicine assistant (index.html).  
Red glassmorphism theme, SpeechSynthesis TTS, SpeechRecognition fallback, Agora ASR hooks.

## Quick start (local)
1. Open a terminal in the project folder:
   cd "C:\Users\dell\Desktop\new"
2. Serve the site (recommended — some APIs require a secure origin):
   - With Python:
     py -m http.server 8000
   - Or with Node (if installed):
     npx http-server -p 8000
3. Visit: http://localhost:8000 in your browser.

## Important setup
- Edit `script.js` / `index.html` to set your Agora App ID (if using Agora ASR).  
  Do NOT store production AI keys in client-side files — use a server-side proxy.
- TTS uses browser SpeechSynthesis (voice selector in the UI).
- Voice capture uses Web SpeechRecognition as a fallback. For full Agora ASR, ensure the ASR extension script is loaded.

## Features
- Voice reminders (add + set by voice)
- AI medicine search panel (voice search)
- Medicine image / prescription upload UI
- TTS voice selector + preview
- Transcript export (download + clipboard)

## Troubleshooting
- "ASR Extension script not loaded" — check:
  - Network tab for AgoraRTC_ASR_Extension.js (200 OK, no CORS).
  - Page served over HTTPS for secure-context features.
  - Console for errors; ensure AgoraRTC library is loaded before extension.
  - Use the included `ensureAsrExtensionLoaded()` helper if present.
- SpeechRecognition not available on some browsers (Safari, older Edge). Use Chrome/Edge (Chromium) for best support.
- If voices are missing, wait a few seconds (voices load asynchronously) or try a different browser.

## Notes & next steps
- Add a small server to proxy AI requests (hide keys) — I can scaffold an Express example if you want.
- Can further refine red glassmorphism CSS into `style.css` and optimize accessibility/contrast.

## Files to check
- `index.html` — main UI
- `script.js` — app logic (speech, reminders, AI calls)
- `style.css` — custom styles (glass, accents)

---

If you want, I can:
- add an Express proxy example (Windows-ready),
- generate a short checklist to fix ASR loading with exact console commands,
- or create a dedicated `README-DEV.md` with development tasks.
