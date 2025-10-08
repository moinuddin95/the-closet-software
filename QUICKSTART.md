# Quick Start Guide

## For Users

### Installation (5 minutes)

1. **Download the Extension**
   ```bash
   git clone https://github.com/moinuddin95/the-closet-software.git
   ```
   Or download and extract the ZIP file.

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `the-closet-software` folder
   - Done! The extension is now active.

3. **Start Saving Products**
   - Visit any product on Amazon, eBay, Walmart, etc.
   - Look for the purple "Save to Closet" button
   - Click it to save the product
   - Click the extension icon to see your saved products

### Daily Usage

**Saving Products:**
1. Browse your favorite shopping sites
2. When you find a product you like, click "Save to Closet"
3. Continue shopping or close the tab

**Viewing Saved Products:**
1. Click the extension icon (top-right of Chrome)
2. Browse your saved products
3. Click "View" to revisit any product
4. Click "Remove" to delete items you're no longer interested in

**Managing Your Closet:**
- Products are automatically organized by save date (newest first)
- Each product shows: image, title, price, and source site
- Use "Clear All" to start fresh

## For Developers

### Project Structure

```
the-closet-software/
├── manifest.json           # Extension configuration
├── content.js              # Product detection & button injection
├── background.js           # Service worker
├── popup.html              # Extension popup UI
├── popup.js                # Popup logic
├── popup.css               # Popup styles
├── styles.css              # Content script styles
├── icons/                  # Extension icons
├── README.md               # Main documentation
├── GUIDE.md                # User guide
├── TESTING.md              # Testing documentation
└── QUICKSTART.md          # This file
```

### Development Setup

1. **Clone & Setup**
   ```bash
   git clone https://github.com/moinuddin95/the-closet-software.git
   cd the-closet-software
   ```

2. **No Build Required!**
   This extension uses vanilla JavaScript - no build process needed.
   Just load it directly into Chrome.

3. **Development Workflow**
   - Make code changes
   - Go to `chrome://extensions/`
   - Click the refresh icon on "The Closet" extension
   - Test your changes

### Key Files to Modify

**Adding New E-commerce Sites:**
Edit `content.js` and add to `PRODUCT_PATTERNS`:
```javascript
newsite: {
  urlPattern: /\/product\//,
  titleSelector: 'h1.product-title',
  imageSelector: 'img.product-image',
  priceSelector: '.product-price',
  insertTarget: 'h1.product-title'
}
```

Then add to `manifest.json` permissions:
```json
"*://*.newsite.com/*"
```

**Changing Button Styles:**
Edit `styles.css` - modify `.closet-save-button` class

**Changing Popup Design:**
- Layout: Edit `popup.html`
- Styles: Edit `popup.css`
- Logic: Edit `popup.js`

### Testing Your Changes

1. **Content Script Changes:**
   - Visit a product page
   - Open DevTools Console
   - Look for "The Closet:" log messages
   - Check button appearance and functionality

2. **Popup Changes:**
   - Right-click popup → "Inspect"
   - Use DevTools to debug popup
   - Check for console errors

3. **Background Script Changes:**
   - Go to `chrome://extensions/`
   - Click "service worker" link under extension
   - Check console for errors

### Debugging Tips

**Enable Verbose Logging:**
All scripts include console.log statements. Open DevTools to see:
- Product detection status
- Button injection confirmation
- Save operations
- Storage updates

**Common Issues:**

*Button doesn't appear*
- Check URL pattern matches
- Verify selectors work on the site
- Check console for detection logs

*Save doesn't work*
- Check storage permissions in manifest
- Look for errors in content script console
- Verify Chrome storage API is accessible

*Popup doesn't show products*
- Check background service worker console
- Verify storage has data (DevTools → Application → Storage)
- Check for JavaScript errors in popup console

### Code Style

This project uses:
- **ES6+ JavaScript** (async/await, arrow functions, etc.)
- **Vanilla JS** (no frameworks)
- **Chrome Extension APIs** (storage, runtime, tabs)
- **Modern CSS** (flexbox, grid, gradients)

Keep it simple and maintainable!

### Adding Features

**Example: Add Product Notes**

1. Update product extraction in `content.js`:
   ```javascript
   return {
     // ... existing fields
     notes: '' // Add notes field
   };
   ```

2. Update popup to show/edit notes in `popup.html`:
   ```html
   <textarea class="product-notes"></textarea>
   ```

3. Add note editing logic in `popup.js`

4. Update storage on note changes

### Performance Considerations

- **Content Script**: Runs on every page load - keep it lightweight
- **DOM Queries**: Cache selectors when possible
- **Storage**: Limit to reasonable number of products (recommend < 1000)
- **Images**: Don't store image data, just URLs

### Security Best Practices

✅ **Do:**
- Sanitize user input
- Use parameterized queries
- Validate storage data
- Minimize permissions
- Use CSP-compliant code

❌ **Don't:**
- Use eval() or innerHTML with user data
- Store sensitive information
- Make unnecessary network requests
- Request excessive permissions

## Publishing (Optional)

To publish to Chrome Web Store:

1. **Prepare Package**
   - Remove test files
   - Update version in manifest.json
   - Create a ZIP of the extension folder

2. **Create Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 registration fee

3. **Submit Extension**
   - Upload ZIP file
   - Fill in store listing details
   - Add screenshots and description
   - Submit for review (usually 1-3 days)

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

## Getting Help

- Check the [README.md](README.md) for feature overview
- See [TESTING.md](TESTING.md) for detailed testing guide
- Review [GUIDE.md](GUIDE.md) for visual guide
- Open an issue on GitHub for bugs or questions

## Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Please ensure:
- Code follows existing style
- All features work as expected
- No console errors
- README updated if needed

---

Happy coding! 🚀
