# 🧩 Background (service worker)

The background script (`src/background.ts`) runs as a Manifest V3 service worker and acts as the backend coordinator for the extension. It handles messages from the content script and popup, talks to Supabase, and manages Chrome storage.

## Message actions handled

```
saveProduct | getProducts | removeProduct | clearAll
getProductsPattern
signInAnonymously | getUser | signOut
uploadImage | getuserImageId
processTryon | getTryonImageIfExists
```


## Responsibilities

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
  - `processTryon`: ensures a clothing item exists (`clothing_items`), then invokes Supabase Edge Function `tryon` with `clothing_id`, `user_image_id` and `product_url`.
  - `getTryonImageIfExists`: looks up a try-on result in `tryon_results` for the current user, then returns a signed URL from Supabase Storage.

## Data flow: Try‑on (high level)

1. Content script extracts product info on a supported site and sends `processTryon`.
2. Background ensures a `clothing_items` record exists (insert or fetch on unique image per user).
3. Background invokes the `tryon` Edge Function with `clothing_id`, `user_image_id` and `product_url`.
4. When a result exists, content can request `getTryonImageIfExists` and receive a signed URL to inject back into the page UI.

## Storage keys used

- `savedProducts`: Array of saved product objects.
- `userId`: Numeric user id mapped from Supabase `users` table (by `auth_id`).
- `userImageId`: Last uploaded image id for the user (used by try‑on).

## Implementation notes

- All async message handlers return `true` to keep the port open until `sendResponse` is called.
- The background is registered as a module service worker in the manifest, allowing ESM imports (e.g., Supabase client, JSON patterns).
