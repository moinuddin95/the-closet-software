// Popup JavaScript for The Closet extension

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  
  // Set up event listeners
  document.getElementById('clearAllBtn').addEventListener('click', clearAllProducts);
});

// Load and display saved products
async function loadProducts() {
  try {
    const result = await chrome.storage.local.get(['savedProducts']);
    const products = result.savedProducts || [];
    
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Display products in the popup
function displayProducts(products) {
  const productCount = document.getElementById('productCount');
  const emptyState = document.getElementById('emptyState');
  const productList = document.getElementById('productList');
  const footer = document.querySelector('.popup-footer');
  
  // Update product count
  productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} saved`;
  
  if (products.length === 0) {
    // Show empty state
    emptyState.classList.add('visible');
    productList.classList.remove('visible');
    footer.classList.remove('visible');
  } else {
    // Show product list
    emptyState.classList.remove('visible');
    productList.classList.add('visible');
    footer.classList.add('visible');
    
    // Clear existing items
    productList.innerHTML = '';
    
    // Create product items
    products.forEach((product, index) => {
      const productItem = createProductItem(product, index);
      productList.appendChild(productItem);
    });
  }
}

// Create a product item element
function createProductItem(product, index) {
  const item = document.createElement('div');
  item.className = 'product-item';
  
  const imageUrl = product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
  
  item.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${product.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect fill=\\'%23f3f4f6\\' width=\\'100\\' height=\\'100\\'/%3E%3C/svg%3E'">
    </div>
    <div class="product-info">
      <div class="product-title">${escapeHtml(product.title)}</div>
      <div class="product-meta">
        <div class="product-price">${escapeHtml(product.price)}</div>
        <div class="product-site">${escapeHtml(product.site)}</div>
      </div>
    </div>
    <div class="product-actions">
      <button class="product-btn view-btn" data-url="${escapeHtml(product.url)}">View</button>
      <button class="product-btn remove-btn" data-index="${index}">Remove</button>
    </div>
  `;
  
  // Add event listeners
  const viewBtn = item.querySelector('.view-btn');
  const removeBtn = item.querySelector('.remove-btn');
  
  viewBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: product.url });
  });
  
  removeBtn.addEventListener('click', async () => {
    await removeProduct(index);
  });
  
  return item;
}

// Remove a product
async function removeProduct(index) {
  try {
    const result = await chrome.storage.local.get(['savedProducts']);
    const products = result.savedProducts || [];
    
    products.splice(index, 1);
    
    await chrome.storage.local.set({ savedProducts: products });
    
    displayProducts(products);
  } catch (error) {
    console.error('Error removing product:', error);
  }
}

// Clear all products
async function clearAllProducts() {
  const confirmed = confirm('Are you sure you want to remove all saved products?');
  
  if (confirmed) {
    try {
      await chrome.storage.local.set({ savedProducts: [] });
      displayProducts([]);
    } catch (error) {
      console.error('Error clearing products:', error);
    }
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.savedProducts) {
    displayProducts(changes.savedProducts.newValue || []);
  }
});
