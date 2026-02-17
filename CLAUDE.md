# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build (tsc -b && vite build)
npm run lint      # ESLint (flat config, ESLint 9+)
npm run preview   # Preview production build locally
```

No test framework is configured. TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.

## Architecture

RSVP (Rapid Serial Visual Presentation) speed reader — a client-side React/TypeScript app with no backend. Deployed as static files to AWS Amplify.

### Data flow

```
Input (TextInput / PDFUploader / MOBIUploader)
  → textProcessor.tokenizeText() → Token[] (word + duration + ORP index)
  → useRSVPEngine (requestAnimationFrame playback loop)
  → WordDisplay (renders one word at a time with ORP highlight)
```

### Key modules

- **`src/hooks/useRSVPEngine.ts`** — Core playback engine. Uses `requestAnimationFrame` for timing precision. State is in `useState`, but the playback loop reads from refs (`tokensRef`, `currentIndexRef`, `startTimeRef`) to avoid stale closures and unnecessary re-renders during animation.

- **`src/utils/textProcessor.ts`** — Tokenizes text into `Token[]` with adaptive timing. Duration = `(60000/wpm) × lengthFactor × punctuationFactor × paragraphFactor`, capped at `maxWordDelay`. ORP (Optimal Recognition Point) is at ~30-40% of word length.

- **`src/utils/storage.ts`** — localStorage persistence (`rsvp-reader-state` key). Saves reading position, text, settings, timing config, and MOBI state. Auto-saves debounced (1s) and on `beforeunload`.

- **`src/utils/mobiProcessor.ts`** — Parses MOBI/KF8 files into chapters. Tries TOC-based extraction first, falls back to spine order. Strips HTML and decodes entities.

- **`src/App.tsx`** — Orchestrates everything. Owns `readingSettings`, MOBI state, and persistence wiring. Restores saved state on mount.

### State management

Pure React hooks — no Redux or Context. `useRSVPEngine` owns all playback state. `App.tsx` owns display settings and MOBI state. Persistence is handled at the App level.

### PDF loading

`PDFUploader` supports file upload and URL loading. URL loading uses a CORS proxy fallback chain (hardcoded in the component). Page range selection is supported.

### App version

Read from `package.json` via `src/utils/storage.ts`, displayed in the footer, and included in persisted state for future migration detection.
