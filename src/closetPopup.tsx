import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import "./closetPopup.css";

interface Product {
  title: string;
  price: string;
  site: string;
  url: string;
  image?: string;
}

interface ClosetPopupProps {
  onClose: () => void;
}

export function ClosetPopup({ onClose }: ClosetPopupProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products when popup opens
  useEffect(() => {
    (async () => {
      try {
        const result = await chrome.storage.local.get(["savedProducts"]);
        setProducts(result.savedProducts || []);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Listen for storage updates (e.g., from other tabs)
  useEffect(() => {
    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      namespace: string
    ) => {
      if (namespace === "local" && changes.savedProducts) {
        setProducts(changes.savedProducts.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  async function removeProduct(index: number) {
    try {
      const result = await chrome.storage.local.get(["savedProducts"]);
      const updated = (result.savedProducts || []) as Product[];
      updated.splice(index, 1);
      await chrome.storage.local.set({ savedProducts: updated });
      setProducts([...updated]);
    } catch (err) {
      console.error("Error removing product:", err);
    }
  }

  async function clearAll() {
    if (!confirm("Are you sure you want to remove all saved products?")) return;
    await chrome.storage.local.set({ savedProducts: [] });
    setProducts([]);
  }

  function openProduct(url: string) {
    chrome.tabs.create({ url });
  }

  // Small helper to prevent XSS
  function escapeHtml(text: string) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- UI rendering ---

  if (loading) {
    return (
      <div class="closet-popup-overlay" onClick={onClose}>
        <div class="closet-popup-wrapper" onClick={(e) => e.stopPropagation()}>
          <div class="popup-container">
            <p style="text-align:center; padding: 20px;">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div class="closet-popup-overlay" onClick={onClose}>
        <div class="closet-popup-wrapper" onClick={(e) => e.stopPropagation()}>
          <div class="popup-container">
            <header class="popup-header">
              <div class="header-content">
                <h1>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  My Closet
                </h1>
                <p class="subtitle">0 products saved</p>
              </div>
              <button class="closet-close-btn" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </header>
            <div id="emptyState" class="empty-state visible">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h2>Your closet is empty</h2>
              <p>
                Visit any product page on an e-commerce site and click the "Save to
                Closet" button to start saving products!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="closet-popup-overlay" onClick={onClose}>
      <div class="closet-popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <div class="popup-container">
          <header class="popup-header">
            <div class="header-content">
              <h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                My Closet
              </h1>
              <p class="subtitle">
                {products.length} product{products.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <button class="closet-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </header>

          <div id="productList" class="product-list visible">
            {products.map((product, index) => (
              <div class="product-item" key={index}>
                <div class="product-image">
                  <img
                    src={
                      product.image ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E"
                    }
                    alt={product.title}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E")
                    }
                  />
                </div>
                <div class="product-info">
                  <div class="product-title">{escapeHtml(product.title)}</div>
                  <div class="product-meta">
                    <div class="product-price">{escapeHtml(product.price)}</div>
                    <div class="product-site">{escapeHtml(product.site)}</div>
                  </div>
                </div>
                <div class="product-actions">
                  <button
                    class="product-btn view-btn"
                    onClick={() => openProduct(product.url)}
                  >
                    View
                  </button>
                  <button
                    class="product-btn remove-btn"
                    onClick={() => removeProduct(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <footer class="popup-footer visible">
            <button id="clearAllBtn" class="clear-btn" onClick={clearAll}>
              Clear All
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
