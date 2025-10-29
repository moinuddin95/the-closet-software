## 🧭 Content script (`src/content.ts`)

The content script is injected on product pages and is responsible for page detection, DOM parsing, UI injection (Save / Try On), and orchestrating calls to the background worker.

### Responsibilities

- Pattern loading: fetches site definitions from the background with `getProductsPattern` and converts each `urlPattern` string into a RegExp.
- Site detection: matches the current hostname/URL against loaded patterns (`getSiteIdentifier`, `getSitePattern`).
- Product-page checks: verifies essential elements (title, thumbnail list) exist (`isProductPage`).
- Apparel checks: light keyword-based check on the title to decide if Try On UI should appear (`isApparelPage`).
- Product extraction: reads title, price, canonicalized image URL, and page URL (`extractProductInfo`, `resolveRelativeImageUrl`, `extractPrice`).
- UI injection:
  - Button container: inserts `#closet-btns-container` near the product title/target element.
  - Save button: adds `#closet-save-btn` and wires `handleSaveClick`.
  - Try On split button: adds `#closet-tryon-btn` plus an optional caret dropdown `#closet-dropdown-btn` with a menu to replace user image (`injectTryonButton`, `injectTryonCarotButtonIfDoesntExist`).
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