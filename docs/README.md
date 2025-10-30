# The Closet Software

## 🚀 Overview

A web extension that enables seamless virtual try-on of clothing items on various e-commerce websites using AI technology. It also comes with saving feature to store and manage your favorite try-on images. All this is achieved seamlessly within your browser and without the need for any login/signup.

## ✨ Features

- Virtual try-on using AI
- Cross-platform web extension (H&M, Amazon, Old Navy, Gap, etc.)
- Save and manage favorite try-on images
- No login/signup required

## 🎥 Demo

![Demo GIF](assets/demo/demo-gif.gif)

Watch the walkthrough on YouTube: https://youtu.be/vtxYQ-ta5XI

## 🧠 Tech Stack

- Frontend: Chrome Extension, React
- Backend: Supabase, Deno.js
- Database: PostgreSQL
- APIs / AI Models: Nano banana (Google gemini-image-2.5)
- Deployment: Vercel

## ⚙️ Installation

Step-by-step setup guide:

```bash
git clone https://github.com/moinuddin95/the-closet-software
cd the-closet-software
npm install
npm run build
```

Load the unpacked extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable "Developer mode" using the toggle in the top right corner.
3. Click "Load unpacked" and select the `dist` directory of your project.

## 📁 Project structure

At a glance

```
the-closet-software/
├─ manifest.json                # Chrome MV3 manifest (content scripts, background, popup, resources)
├─ package.json                 # Dev dependencies and scripts (build, dev)
├─ tsconfig.json                # TypeScript compiler options
├─ vite.config.ts               # Vite bundling config for the extension
├─ docs/                        # Documentation files
├─ icons/                       # Extension icon assets (16/48/128)
├─ assets/                      # Documentation images and demo gifs
└─ src/
	├─ content.ts               # Content script: detects product pages, injects UI (Save/Try On), DOM logic
	├─ background.ts            # Background service worker: handles runtime messages and backend operations
	├─ popup.html               # Action popup entry HTML (declared in manifest action.default_popup)
	├─ popup.tsx                # React TSX for the popup UI (renders into popup.html)
	├─ popup.css                # Styles used by the popup UI
	├─ styles.css               # Styles injected with the content script (buttons, dropdown, states)
	├─ tryonImageUploadPopup.tsx# In-page upload dialog module injected by the content script
	├─ tryonImageUploadPopup.css# Styles for the in-page upload dialog
	├─ ProductPatterns.json     # Site selector patterns and optional inject templates per retailer
	├─ chromeStorageAdaptor.ts  # Small helper for Chrome storage access
	└─ supabaseConfig.ts        # Supabase client/config used by background flows
```

## Manifest integration (`manifest.json`)

- Declared under `manifest.json > content_scripts` to inject `src/content.js` and `src/styles.css` at `document_idle` on `<all_urls>`.
- The extension requests host permissions for supported retailers; the content script further gates activation using loaded site patterns so it only injects UI on recognized product pages.
- Web Accessible Resources (`web_accessible_resources`) include `src/*.css` and `src/*.js`.
- Background service worker is registered as a module (`src/background.js`), enabling message-based coordination used by the content script.
- The action popup (`src/popup.html`) is declared in the manifest and will be opened by the content script only by click.
