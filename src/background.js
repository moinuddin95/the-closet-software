// Background service worker for The Closet extension

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
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle popup
  chrome.tabs.sendMessage(tab.id, { action: 'toggleClosetPopup' });
});

// Handle saving a product
async function handleSaveProduct(product) {
  try {
    const result = await chrome.storage.local.get(['savedProducts']);
    const savedProducts = result.savedProducts || [];
    
    // Check if product already exists
    const existingIndex = savedProducts.findIndex(p => p.url === product.url);
    
    if (existingIndex >= 0) {
      savedProducts[existingIndex] = product;
    } else {
      savedProducts.unshift(product);
    }
    
    await chrome.storage.local.set({ savedProducts: savedProducts });
    
    return { success: true, message: 'Product saved successfully' };
  } catch (error) {
    console.error('Error saving product:', error);
    return { success: false, error: error.message };
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.savedProducts) {
    console.log('Saved products updated:', changes.savedProducts.newValue?.length || 0, 'products');
  }
});
