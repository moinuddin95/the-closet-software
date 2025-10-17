// Background service worker for The Closet extension

// Product information schema for saving the product
  interface ProductInfo {
    title: string;
    image: string;
    price: string;
    url: string;
    site: string;
    timestamp: string;
  }

  interface TryonImage {
    url: string;
    productUrl: string;
    timestamp: string;
  }
// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('The Closet extension installed');
    
    // Initialize storage
    chrome.storage.local.set({
      savedProducts: []
    });
  } else if (details.reason === 'update') {
    console.log('The Closet extension updated');
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveProduct') {
    handleSaveProduct(request.product)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getProducts') {
    chrome.storage.local.get(['savedProducts'], (result) => {
      sendResponse({ products: result.savedProducts || [] });
    });
    return true;
  }

  if (request.action === 'removeProduct') {
    handleRemoveProduct(request.product)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'clearAll') {
    clearAllProducts()
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'saveTryonImage') {
    handleSaveTryonImage(request.tryonImageUrl, request.productUrl)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'getTryonImage') {
    handleGetTryonImage(request.productUrl)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Handle saving a product
async function handleSaveProduct(product: ProductInfo) {
  try {
    const result = await chrome.storage.local.get(['savedProducts']);
    const savedProducts = result.savedProducts || [];

    // Check if product already exists
    const existingIndex = savedProducts.findIndex((p: ProductInfo) => p.url === product.url);
    
    if (existingIndex >= 0) {
      savedProducts[existingIndex] = product;
    } else {
      savedProducts.unshift(product);
    }
    
    await chrome.storage.local.set({ savedProducts: savedProducts });
    
    return { success: true, message: 'Product saved successfully' };
  } catch (error: any) {
    console.error('Error saving product:', error);
    return { success: false, error: error.message };
  }
}

async function handleRemoveProduct(product: ProductInfo) {
  try {
    const result = await chrome.storage.local.get(['savedProducts']);
    const savedProducts = result.savedProducts || [];
    const updatedProducts = savedProducts.filter((p: ProductInfo) => p.url !== product.url);
    await chrome.storage.local.set({ savedProducts: updatedProducts });
    return { success: true, message: 'Product removed successfully' };
  } catch (error: any) {
    console.error('Error removing product:', error);
    return { success: false, error: error.message };
  }
}

async function clearAllProducts() {
  try {
    await chrome.storage.local.set({ savedProducts: [] });
    return { success: true, message: 'All products cleared successfully' };
  } catch (error: any) {
    console.error('Error clearing all products:', error);
    return { success: false, error: error.message };
  }
}

// Handle saving a try-on image
async function handleSaveTryonImage(tryonImageUrl: string, productUrl: string) {
  try {
    const result = await chrome.storage.local.get(['tryonImages']);
    const tryonImages = result.tryonImages || {};

    tryonImages[productUrl] = {
      url: tryonImageUrl,
      productUrl: productUrl,
      timestamp: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ tryonImages: tryonImages });
    
    return { success: true, message: 'Try-on image saved successfully' };
  } catch (error: any) {
    console.error('Error saving try-on image:', error);
    return { success: false, error: error.message };
  }
}

// Handle getting a try-on image for a specific product
async function handleGetTryonImage(productUrl: string) {
  try {
    const result = await chrome.storage.local.get(['tryonImages']);
    const tryonImages = result.tryonImages || {};
    const tryonImage = tryonImages[productUrl];
    
    return { success: true, tryonImage: tryonImage || null };
  } catch (error: any) {
    console.error('Error getting try-on image:', error);
    return { success: false, error: error.message };
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.savedProducts) {
    console.log('Saved products updated:', changes.savedProducts.newValue?.length || 0, 'products');
  }
});
