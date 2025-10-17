# Image Upload and Try-On Implementation Notes

## Overview
This document describes the implementation of user image upload functionality and try-on image embedding for the Try-On feature in The Closet extension.

## Architecture

The image upload flow follows this path:
1. **tryonImageUploadPopup.tsx** (Popup UI in page context)
2. **content.ts** (Content script - bridge between page and extension)
3. **background.ts** (Background service worker - handles API calls)
4. **Supabase** (Backend storage)

## Communication Flow

Since the popup is injected as an ES module into the page's DOM (not in the extension context), it cannot directly access Chrome extension APIs. Therefore, we use custom DOM events for communication:

### Step 1: User selects and uploads image
- User clicks "Choose File" and selects an image
- User clicks "Upload" button
- `tryonImageUploadPopup.tsx` reads the file as a data URL

### Step 2: Popup → Content Script
- Popup dispatches a custom DOM event: `closet-upload-image`
- Event detail contains: `{ image: dataURL, mimeType: string }`

### Step 3: Content Script → Background Script
- Content script listens for `closet-upload-image` events
- Relays the data to background script via `chrome.runtime.sendMessage()`
- Message format: `{ action: "uploadImage", image, mimeType }`

### Step 4: Background Script → Supabase
- Background script receives the message
- Calls `handleImageUpload()` function
- Uploads image to Supabase Storage
- Saves metadata to `user_images` table

### Step 5: Response flow back
- Background script returns `{ success: true }` or `{ success: false, error }`
- Content script receives response
- Content script dispatches `closet-upload-response` custom DOM event
- Popup receives event and shows success/error message

## Schema (Existing - Not Modified)

The schema was already defined in `background.ts`:

### user_images table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `mime_type`: Image MIME type
- `image_url`: Storage path to the image
- `created_at`: Timestamp

### Storage
- Bucket: `user-images`
- Path format: `{userId}/{imageId}`

## Files Modified

### 1. src/tryonImageUploadPopup.tsx
**Changes:**
- Added state management for upload status (`isUploading`, `uploadStatus`)
- Implemented file upload via custom DOM events
- Added proper error handling for file reading failures
- Enhanced UI with loading states and status messages
- Clear file and status on close
- Auto-clear success message after 2 seconds

**Key Functions:**
- `handleUploadClick()`: Reads file, dispatches upload event, listens for response
- `onClose()`: Clears file and status on popup close

### 2. src/content.ts
**Changes:**
- Added `setupImageUploadListener()` function
- Listens for `closet-upload-image` custom DOM events
- Relays image data to background script via Chrome messaging API
- Sends response back to popup via `closet-upload-response` event
- Includes try-catch error handling

**Key Functions:**
- `setupImageUploadListener()`: Sets up DOM event listener and Chrome messaging relay

### 3. src/tryonImageUploadPopup.css
**Changes:**
- Added `.tryon-status-message` for status display
- Added `.tryon-status-success` with green styling
- Added `.tryon-status-error` with red styling
- Proper spacing and responsive design

## Testing Checklist

- [ ] User can select an image file
- [ ] Upload button is disabled when no file is selected
- [ ] Upload button shows "Uploading..." during upload
- [ ] Success message appears on successful upload
- [ ] Error message appears on upload failure
- [ ] File preview is shown after selection
- [ ] Popup can be closed and reopened
- [ ] Multiple uploads work correctly
- [ ] Large images are handled properly
- [ ] Invalid file types show appropriate error

## Error Handling

1. **No file selected**: Shows error message in popup
2. **File read error**: Shows "Failed to read file" message
3. **Extension messaging error**: Caught and shown as upload failure
4. **Backend upload error**: Returned from background script and displayed
5. **User not authenticated**: Backend returns error message

## Security Considerations

1. **File validation**: Accept only image/* MIME types in file input
2. **Data URL**: Image is converted to base64 data URL before transmission
3. **User authentication**: Upload requires authenticated user (checked in background.ts)
4. **Supabase security**: RLS policies should be configured on the backend

## Future Improvements

1. Add drag-and-drop file upload support
2. Add image size/dimension validation
3. Add image compression before upload for large files
4. Show upload progress percentage
5. Support multiple image uploads
6. Add image cropping/editing before upload

---

## Try-On Image Embedding

### Overview
After a successful try-on processing, the generated try-on image is embedded directly into the product page DOM, specifically within the Amazon image carousel/gallery for a seamless user experience.

### Implementation Details

#### Flow
1. User clicks "Try On" button
2. `handleTryonClick()` checks if user image exists
3. If exists, calls `processTryon()` which sends request to background script
4. Background script processes the try-on via Supabase edge function
5. Edge function returns `publicUrl` containing the try-on image URL
6. `processTryon()` calls `embedTryonImage()` with the URL
7. Image is injected into the Amazon carousel

#### Key Functions (content.ts)

##### `findAmazonImageCarousel()`
**Purpose:** Locates the Amazon image carousel/gallery container.

**Selectors tried (in order):**
- `#altImages ul` - Desktop thumbnail list
- `#imageBlock_feature_div #altImages` - Alternative desktop layout
- `.a-carousel-viewport` - Carousel viewport
- `#imageBlock` - Main image block container
- `#main-image-container` - Another common container

**Returns:** The carousel container HTMLElement or null if not found.

**Fallback:** If no carousel is found, falls back to `fallbackImageInjection()`.

##### `createTryonImageElement(imageUrl: string)`
**Purpose:** Creates a properly styled try-on image element.

**For Amazon:**
- Creates a list item (`<li>`) matching Amazon's thumbnail structure
- Includes proper CSS classes for visual consistency
- Sets `data-closet-tryon="1"` attribute for identification
- Adds click handler to display image in main viewer
- Uses 40px x 40px dimensions to match Amazon thumbnails

**For other sites (fallback):**
- Creates a simple `<img>` element
- Applies purple border (2px solid #667eea) for visual distinction
- Uses responsive sizing (max-width: 100%)

**Returns:** HTMLElement ready for injection.

##### `embedTryonImage(imageUrl: string)`
**Purpose:** Main function to embed the try-on image into the DOM.

**Logic:**
1. Checks if try-on image already exists (via `data-closet-tryon` attribute)
2. If exists, removes old image to avoid duplicates
3. For Amazon: finds carousel and inserts image as first item
4. For other sites: uses fallback injection after main product image
5. Logs success or errors to console

**Integration:** Called automatically when `processTryon()` succeeds.

##### `fallbackImageInjection(imageUrl: string)`
**Purpose:** Fallback injection method when carousel is not found.

**Logic:**
1. Uses existing site pattern to find main product image
2. Inserts try-on image as next sibling to main image
3. Applied for non-Amazon sites or when Amazon carousel detection fails

#### DOM Structure (Amazon)

**Before injection:**
```html
<ul class="a-unordered-list...">
  <li class="item imageThumbnail">...</li>
  <li class="item imageThumbnail">...</li>
</ul>
```

**After injection:**
```html
<ul class="a-unordered-list...">
  <li class="item imageThumbnail" data-closet-tryon="1">
    <span class="a-list-item">
      <span class="a-button a-button-thumbnail">
        <span class="a-button-inner">
          <input class="a-button-input" type="submit">
          <img src="[try-on-url]" alt="Virtual Try-On Result" class="a-dynamic-image">
        </span>
      </span>
    </span>
  </li>
  <li class="item imageThumbnail">...</li>
  <li class="item imageThumbnail">...</li>
</ul>
```

### Button State Management

The "Try On" button now shows visual feedback during processing:

**States:**
1. **Default:** Purple gradient, "Try On" text
2. **Processing:** Gray gradient, spinner animation, "Processing Try-On..." text
3. **Success:** Green gradient, checkmark icon, "Try-On Complete!" text (2 seconds)
4. **Error:** Red gradient, "Try-On Failed! Try again" text (2 seconds)

### Compatibility

#### Desktop Amazon
- ✅ Works with standard product pages
- ✅ Injects into thumbnail carousel
- ✅ Click handler shows image in main viewer
- ✅ Matches Amazon's styling

#### Mobile Amazon
- ✅ Should work with same selectors
- ✅ Falls back to simple injection if carousel not found

#### Other Sites
- ✅ Uses fallback injection
- ✅ Inserts after main product image
- ✅ Applies visual distinction (purple border)

### Edge Cases Handled

1. **Carousel not found:** Uses `fallbackImageInjection()`
2. **Image already embedded:** Removes old image before adding new one
3. **Non-Amazon sites:** Uses site-specific patterns for fallback
4. **Main image not found:** Logs warning and returns gracefully
5. **Processing errors:** Shows error state on button, doesn't inject image

### MutationObserver

The existing MutationObserver in `init()` ensures buttons remain present on SPA-style page updates. The try-on image injection happens on-demand when the user clicks "Try On", so it doesn't require special observer handling. If Amazon's page structure changes after injection (rare), the user can simply click "Try On" again.

### Testing Checklist

- [ ] Try-on image appears in Amazon carousel after successful processing
- [ ] Image matches Amazon thumbnail styling (size, structure)
- [ ] Clicking thumbnail shows try-on in main viewer
- [ ] Works on different Amazon product pages
- [ ] Fallback injection works when carousel not found
- [ ] Old try-on images are replaced when processing again
- [ ] Button shows correct states (processing, success, error)
- [ ] No interference with Amazon's native zoom/hover
- [ ] Works on mobile Amazon pages
- [ ] Console logs are informative for debugging

### Future Enhancements

1. Add support for multiple try-on results (outfit combinations)
2. Add download button for try-on image
3. Add share functionality for try-on results
4. Persist try-on images across page reloads
5. Add comparison slider between original and try-on
6. Support for non-Amazon carousels (eBay, Walmart, etc.)
