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

## 📁 Project structure

At a glance

```
the-closet-software/
├─ manifest.json                # Chrome MV3 manifest (content scripts, background, popup, resources)
├─ package.json                 # Dev dependencies and scripts (build, dev)
├─ tsconfig.json                # TypeScript compiler options
├─ vite.config.ts               # Vite bundling config for the extension
├─ README.md                    # Project overview and docs
├─ LICENSE                      # License file
├─ icons/                       # Extension icon assets (16/48/128)
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

Notes

- The content script (src/content.ts) communicates with the background service worker via chrome.runtime.sendMessage for actions such as loading product patterns, saving products, uploading images, and processing try-on requests.
- The background service worker (src/background.ts) handles these messages and performs the necessary operations, such as interacting with the Supabase backend or managing Chrome storage.
- The manifest declares src/styles.css as a content stylesheet and registers src/content.js as the content script. The build step produces the JavaScript/CSS artifacts referenced by the manifest.
- The popup UI is defined by src/popup.html (manifest action.default_popup) and rendered by src/popup.tsx.
- The in-page try-on upload UI is dynamically injected by the content script using src/tryonImageUploadPopup.css and src/tryonImageUploadPopup.tsx.

## 🧩 Background (service worker)

The background script (`src/background.ts`) runs as a Manifest V3 service worker and acts as the backend coordinator for the extension. It handles messaging from the content script and popup, talks to Supabase, and manages Chrome storage.

### Responsibilities

- Install/update lifecycle: initializes local storage (`savedProducts`) on first install.
- Message routing: listens to `chrome.runtime.onMessage` and responds asynchronously with `sendResponse` (returning `true` to keep the channel open).
- Auth (Supabase):
  - `signInAnonymously`: creates an anonymous user, mirrors it into the `users` table, then caches `userId` in `chrome.storage.local`.
  - `getUser`: fetches the current auth user from Supabase.
  - `signOut`: clears the Supabase session.
- Product save/remove/clear (Chrome storage):
  - `saveProduct`, `removeProduct`, `clearAll`, `getProducts` manage an array in `chrome.storage.local.savedProducts`.
- Product patterns:
  - `getProductsPattern` returns the loaded `ProductPatterns.json` to the content script for site-specific selectors and injection templates.
- Image upload pipeline:
  - `uploadImage`: reserves a row in `user_images`, decodes image data/URL to bytes, uploads to Supabase Storage (`user_uploads`), updates the DB row, and caches `userImageId` in local storage.
- Try-on flow:
  - `processTryon`: ensures a clothing item exists (`clothing_items`), then invokes Supabase Edge Function `tryon` with `clothing_id` and `user_image_id`.
  - `getTryonImageIfExists`: looks up a try-on result in `tryon_results` for the current user, then returns a signed URL from Supabase Storage.
- Diagnostics: logs storage changes for `savedProducts`.

### Message actions handled

```
saveProduct | getProducts | removeProduct | clearAll
getProductsPattern
signInAnonymously | getUser | signOut
uploadImage | getuserImageId
processTryon | getTryonImageIfExists
```

### Data flow: Try‑on (high level)

1. Content script extracts product info on a supported site and sends `processTryon`.
2. Background ensures a `clothing_items` record exists (insert or fetch on unique image per user).
3. Background invokes the `tryon` Edge Function with `clothing_id` and `user_image_id` (previously set via `uploadImage`).
4. When a result exists, content can request `getTryonImageIfExists` and receive a signed URL to inject back into the page UI.

### Storage keys used

- `savedProducts`: Array of saved product objects.
- `userId`: Numeric user id mapped from Supabase `users` table (by `auth_id`).
- `userImageId`: Last uploaded image id for the user (used by try‑on).

### Implementation notes

- All async message handlers return `true` to keep the port open until `sendResponse` is called.
- The background is registered as a module service worker in the manifest, allowing ESM imports (e.g., Supabase client, JSON patterns).
