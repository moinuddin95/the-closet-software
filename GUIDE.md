# The Closet Extension - Visual Guide

## How It Works

### 1. Installation
Load the extension in Chrome by going to `chrome://extensions/`, enabling Developer Mode, and clicking "Load unpacked" to select this directory.

### 2. Product Page Detection
When you visit a product page on any supported e-commerce site, the extension automatically:
- Detects that you're on a product page
- Extracts product information (title, image, price)
- Injects a "Save to Closet" button near the product title

### 3. Saving Products
Click the **"Save to Closet"** button to:
- Save the product information to local storage
- See a confirmation animation
- Access the product later from the extension popup

### 4. Managing Your Closet
Click the extension icon to:
- View all saved products
- See product images, titles, and prices
- Open product pages with one click
- Remove individual products
- Clear all products at once

## Supported E-commerce Sites

The extension works on these major platforms:

1. **Amazon** (amazon.com, amazon.co.uk, amazon.ca)
   - Detects: /dp/, /gp/product/ URLs
   - Extracts: Product title, main image, price

2. **eBay** (ebay.com, ebay.co.uk)
   - Detects: /itm/ URLs
   - Extracts: Item title, image, price

3. **Walmart** (walmart.com)
   - Detects: /ip/ URLs
   - Extracts: Product name, image, price

4. **Target** (target.com)
   - Detects: /p/ URLs
   - Extracts: Product title, image, price

5. **Etsy** (etsy.com)
   - Detects: /listing/ URLs
   - Extracts: Item title, image, price

And 10+ more platforms!

## Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension manifest version
- **Content Scripts**: Injected into e-commerce pages for detection and UI
- **Service Worker**: Background script for managing storage
- **Local Storage**: Chrome's storage API for persisting data

### Product Detection Logic
1. URL pattern matching (e.g., /dp/ for Amazon)
2. DOM element verification (title and image selectors)
3. Site-specific selectors for accurate data extraction

### Privacy & Security
- No data sent to external servers
- All storage is local to your browser
- Only activates on whitelisted e-commerce domains
- No tracking or analytics

## Testing Instructions

To test the extension:

1. **Load the extension** in Chrome
2. **Visit a product page** on any supported site (e.g., search for a product on Amazon)
3. **Look for the button** - The "Save to Closet" button should appear near the product title
4. **Click to save** - The button should animate and confirm the save
5. **Open the popup** - Click the extension icon to see your saved product
6. **Test removal** - Click "Remove" to delete the product or "Clear All" to reset

## Example Test URLs

Try these URLs to test the extension:
- Amazon: Any product URL containing /dp/
- eBay: Any listing URL containing /itm/
- Walmart: Any product URL containing /ip/
- Target: Any product URL containing /p/
- Etsy: Any listing URL containing /listing/

## Troubleshooting

**Button doesn't appear?**
- Refresh the page
- Check that you're on a product page (not search results)
- Open the browser console and look for "The Closet" messages

**Save button not working?**
- Check browser console for errors
- Verify the extension has permission for the site
- Try reloading the extension

**Products not showing in popup?**
- Check Chrome storage in DevTools > Application > Storage
- Verify savedProducts key exists
