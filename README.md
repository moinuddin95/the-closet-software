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

## 🧭 Content script (`src/content.ts`)

The content script is injected on product pages and is responsible for page detection, DOM parsing, UI injection (Save / Try On), and orchestrating calls to the background worker.

### Responsibilities

- Pattern loading: fetches site definitions from the background with `getProductsPattern` and converts each `urlPattern` string into a RegExp.
- Site detection: matches the current hostname/URL against loaded patterns (`getSiteIdentifier`, `getSitePattern`).
- Product-page checks: verifies essential elements (title, thumbnail list) exist (`isProductPage`).
- Apparel heuristic: light keyword-based check on the title to decide if Try On UI should appear (`isApparelPage`).
- Product extraction: reads title, price, canonicalized image URL, and page URL (`extractProductInfo`, `resolveRelativeImageUrl`, `extractPrice`).
- UI injection:
  - Button container: inserts `#closet-btns-container` near the product title/target element (`injectButtonsContainer`).
  - Save button: adds `#closet-save-btn` (class `.closet-button`) and wires `handleSaveClick`.
  - Try On split button: adds `#closet-tryon-btn` plus an optional caret dropdown `#closet-dropdown-btn` with a menu (`injectTryonButton`, `injectTryonCarotButtonIfDoesntExist`).
- Try-on image integration:
  - Template-based injection into the thumbnail list via `injectTryonImage` using either `pattern.injectTemplate` or a template inferred from `extractPatternFromListItem`.
  - Optional hover replacement of main images when `mouseOverTransition` is enabled (`replaceImageToTryon`, `restoreOriginalImage`).
- Upload popup:
  - Injects an in-page upload UI (`tryonImageUploadPopup.tsx` and CSS) via `injectTryonImageUploadPopup`.
  - Listens for `closet-upload-image` events and forwards them to background (`setupImageUploadListener`).
- SPA resilience: uses `MutationObserver` to re-inject/update UI on dynamic page changes and to update button text (e.g., retry state).

### Key DOM conventions

- Marks the primary product image with `data-closet-main-image="1"` (`pinMainImage`).
- Tags injected try-on thumbnails with `data-closet-injected="1"` to deduplicate or update.
- Relies on selectors from the active site pattern: `titleSelector`, `insertTarget`, `mainImage`, `priceSelector`, `thumbnailList`, `thumbnailItem`, optional `videoThumbnail`.

### Placeholder replacement in injection templates

`injectTryonImage` replaces the following placeholders inside `injectTemplate` (or inferred template):

- `{{imageUrl}}`, `{{uniqueId}}`, `{{posInSet}}`, `{{setSize}}`, `{{timestamp}}`, `{{index}}`.

### Messaging used by the content script

- `getProductsPattern` – load site patterns from background.
- `saveProduct` – persist a product (for the Save button).
- `getuserImageId` – check whether a user image is already set (to decide between Try On flow vs. upload popup).
- `processTryon` – request a try-on render for the current product.
- `getTryonImageIfExists` – fetch a signed URL for an existing try-on image (if available).
- `uploadImage` – upload a user image from the injected upload dialog.
- `getUser` / `signInAnonymously` – presence and bootstrap of an authenticated context.

### Control flow (typical)

1. On page load, `loadPatterns()` retrieves site rules; `init()` checks `isProductPage()`.
2. If true, it injects the buttons container and the Save button. For apparel pages, it also injects the Try On button (and caret when a user image exists).
3. On Save: `handleSaveClick` sends `saveProduct` and updates button state.
4. On Try On:
   - If a user image exists, it calls `processTryon()`; on success, `injectTryonImage()` adds the generated image to the gallery list.
   - Otherwise it injects and opens the in-page upload UI. After upload, it re-triggers the Try On flow.
5. Observers keep the UI consistent across SPA navigations and gallery updates.

### CSS integration

- Uses `.closet-button` for shared button styles.
- The Try On split button uses `#closet-tryon-group`, `#closet-tryon-btn`, `#closet-dropdown-btn`, and `#closet-dropdown-menu` which are styled in `src/styles.css`.
