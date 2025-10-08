# The Closet - Product Saver Chrome Extension

A Chrome extension that helps you save products from e-commerce websites to your personal closet. Browse your favorite shopping sites and save products with a single click!

## Features

- 🛍️ **Multi-Site Support**: Works across major e-commerce platforms including:
  - Amazon (all regions)
  - eBay
  - Walmart
  - Target
  - Etsy
  - AliExpress
  - Best Buy
  - Nike
  - Adidas
  - And many more!

- 🎯 **Smart Detection**: Automatically detects product pages and adds a "Save to Closet" button
- 💾 **Local Storage**: All saved products are stored locally in your browser
- 🎨 **Beautiful UI**: Clean, modern interface with a popup to view all your saved products
- ⚡ **Fast & Lightweight**: Minimal performance impact on browsing

## Installation

### Install from Source

1. Clone or download this repository:
   ```bash
   git clone https://github.com/moinuddin95/the-closet-software.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner

4. Click "Load unpacked" button

5. Select the `the-closet-software` directory

6. The extension should now be installed and active!

## Usage

### Saving Products

1. Visit any product page on a supported e-commerce website
2. Look for the **"Save to Closet"** button that appears near the product title
3. Click the button to save the product
4. The button will show a confirmation when the product is saved

### Viewing Saved Products

1. Click the extension icon in your Chrome toolbar
2. A popup will show all your saved products
3. Click "View" to open the product page
4. Click "Remove" to delete a product from your closet
5. Click "Clear All" to remove all saved products

### Supported Websites

The extension automatically activates on the following e-commerce sites:
- Amazon (amazon.com, amazon.co.uk, amazon.ca)
- eBay (ebay.com, ebay.co.uk)
- Walmart (walmart.com)
- Target (target.com)
- Etsy (etsy.com)
- AliExpress (aliexpress.com)
- Shopify stores (*.shopify.com)
- Best Buy (bestbuy.com)
- Zalando (zalando.com)
- ASOS (asos.com)
- Nike (nike.com)
- Adidas (adidas.com)

## Development

### File Structure

```
the-closet-software/
├── manifest.json       # Extension configuration
├── content.js         # Content script for product detection
├── background.js      # Background service worker
├── popup.html         # Popup UI structure
├── popup.js           # Popup functionality
├── popup.css          # Popup styles
├── styles.css         # Content script styles
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

### Building Icons

Icons are already included in the repository. If you need to regenerate them:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate icons (if you have the generate-icons.js script):
   ```bash
   node generate-icons.js
   ```

## Privacy

This extension:
- Does NOT collect any personal data
- Does NOT send data to external servers
- Stores all data locally in your browser using Chrome's storage API
- Only activates on e-commerce websites you visit

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub.

## Changelog

### Version 1.0.0
- Initial release
- Support for 15+ major e-commerce platforms
- Product detection and save functionality
- Popup UI for managing saved products
- Local storage for saved items