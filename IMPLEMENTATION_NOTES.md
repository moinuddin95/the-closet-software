# Image Upload Implementation Notes

## Overview
This document describes the implementation of user image upload functionality for the Try-On feature in The Closet extension.

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
