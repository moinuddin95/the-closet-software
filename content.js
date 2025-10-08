// Content script to detect product pages and add save button
(function() {
  'use strict';

  // Product page detection patterns for different e-commerce sites
  const PRODUCT_PATTERNS = {
    amazon: {
      urlPattern: /\/dp\/|\/gp\/product\//,
      titleSelector: '#productTitle',
      imageSelector: '#landingImage, #imgTagWrapperId img',
      priceSelector: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice',
      insertTarget: '#titleSection, #title_feature_div'
    },
    ebay: {
      urlPattern: /\/itm\//,
      titleSelector: '.x-item-title__mainTitle, h1.it-ttl',
      imageSelector: '.ux-image-carousel-item img, #icImg',
      priceSelector: '.x-price-primary .ux-textspans, #prcIsum',
      insertTarget: '.x-item-title, .it-ttl'
    },
    walmart: {
      urlPattern: /\/ip\//,
      titleSelector: 'h1[itemprop="name"]',
      imageSelector: '.hover-zoom-hero-image img',
      priceSelector: '[itemprop="price"]',
      insertTarget: 'h1[itemprop="name"]'
    },
    target: {
      urlPattern: /\/p\//,
      titleSelector: 'h1[data-test="product-title"]',
      imageSelector: 'img[data-test="image-gallery-image"]',
      priceSelector: '[data-test="product-price"]',
      insertTarget: 'h1[data-test="product-title"]'
    },
    etsy: {
      urlPattern: /\/listing\//,
      titleSelector: 'h1',
      imageSelector: '.wt-max-width-full img',
      priceSelector: '[data-buy-box-region="price"]',
      insertTarget: 'h1'
    },
    generic: {
      urlPattern: /.*/,
      titleSelector: 'h1, [itemprop="name"]',
      imageSelector: '[itemprop="image"], .product-image img, img[alt*="product"]',
      priceSelector: '[itemprop="price"], .price, .product-price',
      insertTarget: 'h1'
    }
  };

  // Detect which e-commerce site we're on
  function detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('target')) return 'target';
    if (hostname.includes('etsy')) return 'etsy';
    return 'generic';
  }

  // Check if current page is a product page
  function isProductPage() {
    const site = detectSite();
    const pattern = PRODUCT_PATTERNS[site];
    
    // Check URL pattern
    if (!pattern.urlPattern.test(window.location.href)) {
      return false;
    }

    // Check if product elements exist
    const title = document.querySelector(pattern.titleSelector);
    const image = document.querySelector(pattern.imageSelector);
    
    return !!(title && image);
  }

  // Extract product information
  function extractProductInfo() {
    const site = detectSite();
    const pattern = PRODUCT_PATTERNS[site];

    const titleEl = document.querySelector(pattern.titleSelector);
    const imageEl = document.querySelector(pattern.imageSelector);
    const priceEl = document.querySelector(pattern.priceSelector);

    return {
      title: titleEl ? titleEl.textContent.trim() : 'Unknown Product',
      image: imageEl ? imageEl.src : '',
      price: priceEl ? priceEl.textContent.trim() : 'N/A',
      url: window.location.href,
      site: site,
      timestamp: new Date().toISOString()
    };
  }

  // Create and inject the save button
  function injectSaveButton() {
    // Check if button already exists
    if (document.getElementById('closet-save-btn')) {
      return;
    }

    const site = detectSite();
    const pattern = PRODUCT_PATTERNS[site];
    const targetElement = document.querySelector(pattern.insertTarget);

    if (!targetElement) {
      console.log('The Closet: Could not find target element for button injection');
      return;
    }

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'closet-save-btn-container';
    buttonContainer.className = 'closet-save-container';

    // Create the save button
    const saveButton = document.createElement('button');
    saveButton.id = 'closet-save-btn';
    saveButton.className = 'closet-save-button';
    saveButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a.5.5 0 0 1 .5.5V7h5.5a.5.5 0 0 1 0 1H8.5v5.5a.5.5 0 0 1-1 0V8H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/>
      </svg>
      <span>Save to Closet</span>
    `;

    // Add click handler
    saveButton.addEventListener('click', handleSaveClick);

    buttonContainer.appendChild(saveButton);
    
    // Insert button after the target element
    targetElement.parentNode.insertBefore(buttonContainer, targetElement.nextSibling);
    
    console.log('The Closet: Save button injected successfully');
  }

  // Handle save button click
  async function handleSaveClick(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    
    // Show loading state
    button.classList.add('closet-saving');
    button.disabled = true;
    button.innerHTML = `
      <svg class="closet-spinner" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30" />
      </svg>
      <span>Saving...</span>
    `;

    try {
      const productInfo = extractProductInfo();
      
      // Get existing saved products
      const result = await chrome.storage.local.get(['savedProducts']);
      const savedProducts = result.savedProducts || [];
      
      // Check if product is already saved
      const existingIndex = savedProducts.findIndex(p => p.url === productInfo.url);
      
      if (existingIndex >= 0) {
        // Update existing product
        savedProducts[existingIndex] = productInfo;
      } else {
        // Add new product
        savedProducts.unshift(productInfo);
      }
      
      // Save to storage
      await chrome.storage.local.set({ savedProducts: savedProducts });
      
      // Show success state
      button.classList.remove('closet-saving');
      button.classList.add('closet-saved');
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
        <span>Saved!</span>
      `;
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.disabled = false;
        button.classList.remove('closet-saved');
        button.innerHTML = originalContent;
      }, 2000);
      
    } catch (error) {
      console.error('The Closet: Error saving product:', error);
      
      // Show error state
      button.classList.remove('closet-saving');
      button.classList.add('closet-error');
      button.innerHTML = `
        <span>Error! Try again</span>
      `;
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.disabled = false;
        button.classList.remove('closet-error');
        button.innerHTML = originalContent;
      }, 2000);
    }
  }

  // Initialize the extension
  function init() {
    // Check if we're on a product page
    if (isProductPage()) {
      console.log('The Closet: Product page detected');
      
      // Inject the save button
      injectSaveButton();
      
      // Re-check after DOM changes (for SPAs)
      const observer = new MutationObserver(() => {
        if (isProductPage() && !document.getElementById('closet-save-btn')) {
          injectSaveButton();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
