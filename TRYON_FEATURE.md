# Virtual Try-On Feature

## Overview
The virtual try-on feature allows users to upload their image and see it embedded seamlessly into Amazon product pages alongside other product images.

## How It Works

### 1. User Flow
1. Visit an apparel product page on Amazon
2. Click the "Try On" button (appears next to "Save Secretly" button)
3. Upload an image through the popup dialog
4. The try-on result appears as a thumbnail in the product image carousel
5. Click the try-on thumbnail to view it in the main image viewer

### 2. Technical Architecture

#### Storage
- Try-on images are stored in Chrome local storage
- Keyed by product URL for easy retrieval
- Images stored as data URLs for offline access

#### DOM Injection
- Images injected as first thumbnail in Amazon's carousel
- Matches Amazon's thumbnail structure and styling
- Distinctive "TRY-ON" badge for identification
- Click handler updates main product image

#### Robustness
- Multiple selector fallbacks for different Amazon layouts
- MutationObserver re-injects if carousel is rebuilt
- Null checks and type validation throughout
- Proper error handling for file operations

### 3. Amazon DOM Structure

The extension targets these carousel selectors (in order of preference):
```javascript
'#altImages ul.a-unordered-list'       // Main thumbnail list
'#imageBlock_feature_div ul'           // Alternative container
'.a-carousel-viewport ul'              // Carousel viewport
'#imageBlock ul'                       // Fallback
```

### 4. Implementation Details

#### Background Service Worker (`background.ts`)
- `handleSaveTryonImage()`: Stores try-on image by product URL
- `handleGetTryonImage()`: Retrieves saved try-on image

#### Try-On Popup (`tryonImageUploadPopup.tsx`)
- File upload with FileReader
- Converts images to data URLs
- Dispatches custom event on successful upload

#### Content Script (`content.ts`)
- `getAmazonImageCarouselSelectors()`: Finds carousel with fallbacks
- `injectTryonImageIntoCarousel()`: Creates and injects thumbnail
- `checkAndInjectTryonImage()`: Loads saved image on page load
- `removeTryonImage()`: Cleanup function

## Limitations

- Currently only supports Amazon product pages
- Requires apparel product detection (based on title keywords)
- Images stored locally (not synced across devices)
- No actual virtual try-on processing (placeholder implementation)

## Future Enhancements

- Integration with actual virtual try-on API
- Support for other e-commerce platforms
- Cloud storage for cross-device sync
- Multiple try-on images per product
- Image editing and filters
