// Content script to detect product pages and add save button
(function () {
  // Product page detection patterns for different e-commerce sites
  interface ProductPattern {
    urlPattern: RegExp;
    titleSelector: string;
    imageSelector: string;
    priceSelector: string;
    insertTarget: string; // CSS selector where to insert the button
  }
  interface ProductPatternBySiteExtension {
    ca?: ProductPattern;
    com: ProductPattern;
  }
  const apparelKeywords = [
    // Tops
    "t-shirt",
    "tee",
    "shirt",
    "blouse",
    "tank",
    "tank top",
    "camisole",
    "crop top",
    "polo",
    "henley",
    "tunic",
    "sweatshirt",
    "hoodie",
    "sweater",
    "jumper",
    "cardigan",
    "pullover",
    "vest",
    "corset",
    "bodysuit",
    "tube top",
    "halter top",

    // Bottoms
    "jeans",
    "pants",
    "trousers",
    "slacks",
    "chinos",
    "cargo pants",
    "leggings",
    "joggers",
    "sweatpants",
    "shorts",
    "capris",
    "culottes",
    "skirt",
    "miniskirt",
    "maxi skirt",
    "midi skirt",

    // Dresses & Sets
    "dress",
    "gown",
    "maxi dress",
    "midi dress",
    "mini dress",
    "sundress",
    "jumpsuit",
    "romper",
    "playsuit",
    "bodysuit",
    "co-ord",
    "two-piece set",
    "overalls",
    "dungarees",
    "unitard",
    "catsuit",

    // Outerwear
    "jacket",
    "coat",
    "overcoat",
    "trench coat",
    "blazer",
    "windbreaker",
    "parka",
    "puffer",
    "raincoat",
    "bomber",
    "leather jacket",
    "denim jacket",
    "fleece",
    "cape",
    "poncho",
    "gilet",

    // Footwear
    "shoes",
    "sneakers",
    "trainers",
    "boots",
    "ankle boots",
    "knee-high boots",
    "sandals",
    "heels",
    "pumps",
    "flats",
    "loafers",
    "oxfords",
    "slippers",
    "flip flops",
    "clogs",
    "mules",

    // Accessories
    "hat",
    "cap",
    "beanie",
    "scarf",
    "gloves",
    "belt",
    "tie",
    "necktie",
    "bow tie",
    "suspenders",
    "watch",
    "bracelet",
    "necklace",
    "earrings",
    "ring",
    "sunglasses",
    "glasses",
    "headband",
    "bandana",

    // Undergarments & Sleepwear
    "underwear",
    "bra",
    "panties",
    "briefs",
    "boxers",
    "boxer briefs",
    "lingerie",
    "sleepwear",
    "pajamas",
    "robe",
    "nightgown",
    "nightdress",
    "slip",
    "bralette",
    "camisole",
    "loungewear",
    "thermal",
    "long johns",

    // Sportswear
    "activewear",
    "sportswear",
    "gym wear",
    "leggings",
    "sports bra",
    "tracksuit",
    "joggers",
    "running shorts",
    "yoga pants",
    "compression shirt",
    "jersey",
    "training top",
    "rash guard",
    "cycling shorts",

    // Kidswear
    "onesie",
    "romper",
    "baby suit",
    "kidswear",
    "toddler outfit",
    "school uniform",
    "baby shoes",
    "bibs",
    "mittens",

    // Traditional / Formalwear
    "suit",
    "tuxedo",
    "dress shirt",
    "kurta",
    "saree",
    "lehenga",
    "kimono",
    "hanbok",
    "cheongsam",
    "abaya",
    "kaftan",
    "thobe",
    "formal dress",
    "evening dress",

    // Swimwear
    "swimsuit",
    "bikini",
    "one-piece",
    "two-piece",
    "board shorts",
    "swim trunks",
    "rash vest",
    "cover-up",
    "sarong",
    "beachwear",
  ];
  // Product information schema for saving the product
  interface ProductInfo {
    title: string;
    image: string;
    price: string;
    url: string;
    site: string;
    timestamp: string;
  }
  const PRODUCT_PATTERNS: Record<string, ProductPatternBySiteExtension> = {
    amazon: {
      com: {
        urlPattern: /\/dp\/|\/gp\/product\//,
        titleSelector: "#productTitle",
        imageSelector: "#landingImage, #imgTagWrapperId img",
        priceSelector:
          ".a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice",
        insertTarget: "#titleSection, #title_feature_div",
      },
    },
    ebay: {
      com: {
        urlPattern: /\/itm\//,
        titleSelector: ".x-item-title__mainTitle, h1.it-ttl",
        imageSelector: ".ux-image-carousel-item img, #icImg",
        priceSelector: ".x-price-primary .ux-textspans, #prcIsum",
        insertTarget: ".x-item-title, .it-ttl",
      },
    },
    walmart: {
      com: {
        urlPattern: /\/ip\//,
        titleSelector: 'h1[itemprop="name"]',
        imageSelector: 'img[data-testid="hero-image"]',
        priceSelector: '[itemprop="price"]',
        insertTarget: 'h1[itemprop="name"]',
      },
      ca: {
        urlPattern: /\/ip\//,
        titleSelector: "h1#main-title",
        imageSelector: 'div[data-seo-id="hero-carousel-image"] img',
        priceSelector: "[data-testid='price-wrap'] span[itemprop='price']",
        insertTarget: "h1#main-title",
      },
    },
    target: {
      com: {
        urlPattern: /\/p\//,
        titleSelector: 'h1[data-test="product-title"]',
        imageSelector: 'img[data-test="image-gallery-image"]',
        priceSelector: '[data-test="product-price"]',
        insertTarget: 'h1[data-test="product-title"]',
      },
    },
    etsy: {
      com: {
        urlPattern: /\/listing\//,
        titleSelector: "h1",
        imageSelector: ".wt-max-width-full img",
        priceSelector: '[data-buy-box-region="price"]',
        insertTarget: "h1",
      },
    },
    generic: {
      com: {
        urlPattern: /.*/,
        titleSelector: 'h1, [itemprop="name"]',
        imageSelector:
          '[itemprop="image"], .product-image img, img[alt*="product"]',
        priceSelector: '[itemprop="price"], .price, .product-price',
        insertTarget: "h1",
      },
    },
  };
  /**
   * Detects the current e-commerce site based on the window's hostname.
   *
   * @returns {string} The detected site identifier: 'amazon', 'ebay', 'walmart', 'target', 'etsy', or 'generic' if none match.
   */
  function getSiteIdentifier() {
    const hostname = window.location.hostname;
    if (hostname.includes("amazon")) return "amazon";
    if (hostname.includes("ebay")) return "ebay";
    if (hostname.includes("walmart")) return "walmart";
    if (hostname.includes("target")) return "target";
    if (hostname.includes("etsy")) return "etsy";
    return "generic";
  }
  /**
   * Gets the site extension (e.g., 'com', 'ca') based on the hostname.
   * Defaults to 'n/a' if no recognized extension is found.
   * @returns {string} The site extension.
   */
  function getSiteExtension() {
    const hostname = window.location.hostname;
    if (hostname.endsWith(".ca")) return "ca";
    if (hostname.endsWith(".com")) return "com";
    return "n/a";
  }

  /**
   * Gets the product pattern for the current site and extension.
   * Returns null if no valid pattern is found.
   * @returns {ProductPattern | null}
   */
  function getSitePattern() {
    let siteExtension = getSiteExtension();
    if (siteExtension === "n/a") return null;

    const site = getSiteIdentifier();
    const patternsWithExtensions = PRODUCT_PATTERNS[site];
    // Switch to .com if the existing site extension pattern doesn't exist
    siteExtension =
      siteExtension !== "com" &&
      !patternsWithExtensions[
        siteExtension as keyof ProductPatternBySiteExtension
      ]
        ? "com"
        : siteExtension;
    // Check URL pattern
    if (
      !patternsWithExtensions?.[
        siteExtension as keyof ProductPatternBySiteExtension
      ]?.urlPattern.test(window.location.href)
    )
      return null;

    return patternsWithExtensions[
      siteExtension as keyof ProductPatternBySiteExtension
    ]!;
  }

  /**
   * Checks if the current page is a product page.
   * @returns {boolean} True if the current page is a product page based on URL and DOM patterns.
   */
  function isProductPage() {
    const pattern = getSitePattern();
    if (!pattern) return false;
    console.info("The Closet: Detected site pattern", pattern);

    // Check if product elements exist
    const title = document.querySelector(pattern.titleSelector);
    const image = document.querySelector(pattern.imageSelector);

    console.info("The Closet: Detected product elements", { title, image });

    return !!(title && image);
  }

  /**
   * Checks if the current product page is likely an apparel page based on title keywords.
   * @returns {boolean} True if the product title contains apparel-related keywords.
   */
  function isApparelPage() {
    const pattern = getSitePattern();
    if (!pattern) return false;

    const titleEl = document.querySelector(pattern.titleSelector);
    for (const keyword of apparelKeywords) {
      if (titleEl?.textContent?.toLowerCase().includes(keyword)) {
        console.log(
          "The Closet: Detected apparel page with title",
          titleEl.textContent
        );
        return true;
      }
    }
    console.log("The Closet: Not an apparel page");
    return false;
  }

  /**
   * Extracts product information from the page.
   * @returns {ProductInfo}
   */
  function extractProductInfo() {
    const site = getSiteIdentifier();
    const pattern = getSitePattern();
    if (!pattern) return null;

    const titleEl = document.querySelector(pattern.titleSelector);
    const imageEl = document.querySelector(pattern.imageSelector);
    const priceEl = document.querySelector(pattern.priceSelector);

    return {
      title: titleEl ? titleEl.textContent.trim() : "Unknown Product",
      image: imageEl ? imageEl.getAttribute("src") : "",
      price: (function () {
        const text = priceEl?.textContent ?? "";
        const re = /\$\d+(\.\d{2})?/;
        const m = re.exec(text);
        return m ? m[0] : "N/A";
      })(),
      url: window.location.href,
      site: site,
      timestamp: new Date().toISOString(),
    } as ProductInfo;
  }

  function injectButtonsContainer() {
    // Check if container already exists
    if (document.getElementById("closet-btns-container")) {
      return;
    }

    const pattern = getSitePattern();
    if (!pattern) return;

    const targetElement = document.querySelector(pattern.insertTarget);

    if (!targetElement?.parentNode) {
      console.log(
        "The Closet: Could not find target element for button injection"
      );
      return;
    }

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "closet-btns-container";
    buttonContainer.className = "closet-container";

    // Insert button after the target element
    targetElement.parentNode.insertBefore(
      buttonContainer,
      targetElement.nextSibling
    );

    console.log("The Closet: button container injected successfully");
  }

  /**
   * Injects the "Save Secretly" button into the product page.
   * DOM Location is sibling to insertTarget in PRODUCT_PATTERNS.
   * @returns {void}
   */
  function injectSaveButton() {
    // Check if button already exists
    if (document.getElementById("closet-save-btn")) {
      return;
    }

    // Select button container
    const buttonContainer = document.querySelector("#closet-btns-container")!;

    // Create the save button
    const saveButton = document.createElement("button");
    saveButton.id = "closet-save-btn";
    saveButton.className = "closet-button";
    saveButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a.5.5 0 0 1 .5.5V7h5.5a.5.5 0 0 1 0 1H8.5v5.5a.5.5 0 0 1-1 0V8H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/>
      </svg>
      <span>Save Secretly</span>
    `;

    // Add click handler
    saveButton.addEventListener("click", handleSaveClick);

    // Append button to container
    buttonContainer.appendChild(saveButton);

    console.log("The Closet: Save button injected successfully");
  }

  function injectTryonButton() {
    // Check if button already exists
    if (document.getElementById("closet-tryon-btn")) {
      return;
    }

    // Select button container
    const buttonContainer = document.querySelector("#closet-btns-container")!;

    // Create the try-on button
    const tryonButton = document.createElement("button");
    tryonButton.id = "closet-tryon-btn";
    tryonButton.className = "closet-button";
    tryonButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a.5.5 0 0 1 .5.5V7h5.5a.5.5 0 0 1 0 1H8.5v5.5a.5.5 0 0 1-1 0V8H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/>
      </svg>
      <span>Try On</span>
    `;

    // Add click handler
    tryonButton.addEventListener(
      "click",
      async (e: Event) => await handleTryonClick(e)
    );

    // Append button to container
    buttonContainer.appendChild(tryonButton);

    console.log("The Closet: Try on button injected successfully");
  }

  /**
   * Handle save button click event.
   * @param {*} event
   * @return {Promise<void>}
   */
  async function handleSaveClick(event: Event) {
    event.preventDefault();

    const button = event.currentTarget as HTMLButtonElement;
    const originalContent = button.innerHTML;

    // Show loading state
    button.classList.add("closet-saving");
    button.disabled = true;
    button.innerHTML = `
      <svg class="closet-spinner" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30" />
      </svg>
      <span>Saving...</span>
    `;

    try {
      const productInfo = extractProductInfo();
      if (!productInfo) throw new Error("Failed to extract product info");

      // Save via background script

      const response = await chrome.runtime.sendMessage({
        action: "saveProduct",
        product: productInfo,
      });

      console.log("The Closet: Save product response", response);

      if (!response.success)
        throw new Error("Failed to save product, response error", response);

      // Show success state
      button.classList.remove("closet-saving");
      button.classList.add("closet-saved");
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
        <span>Saved!</span>
      `;

      // Reset button after 2 seconds
      setTimeout(() => {
        button.disabled = false;
        button.classList.remove("closet-saved");
        button.innerHTML = originalContent;
      }, 2000);
    } catch (error) {
      console.error("The Closet: Error saving product:", error);

      // Show error state
      button.classList.remove("closet-saving");
      button.classList.add("closet-error");
      button.innerHTML = `
        <span>Error! Try again</span>
      `;

      // Reset button after 2 seconds
      setTimeout(() => {
        button.disabled = false;
        button.classList.remove("closet-error");
        button.innerHTML = originalContent;
      }, 2000);
    }
  }

  async function handleTryonClick(event: Event) {
    event.preventDefault();
    const resp = await chrome.runtime.sendMessage({
      action: "getUserImageUrl",
    });
    const userImageUrl = resp?.userImageUrl;
    if (userImageUrl) {
      // Optionally, you could trigger a different flow here (e.g., start try-on immediately)
      return;
    }
    await injectTryonImageUploadPopup();
  }

  /**
   * Inject the try-on image upload popup into the page.
   * @returns {void}
   */
  async function injectTryonImageUploadPopup() {
    // Check if popup already exists
    if (document.getElementById("closet-tryon-popup-root")) {
      document.getElementById("closet-tryon-popup-root")!.style.display =
        "block";
      return;
    }
    // Create a container for the popup (the module will render into it)
    const popupRoot = document.createElement("div");
    popupRoot.id = "closet-tryon-popup-root";
    document.body.appendChild(popupRoot);

    // Inject CSS
    if (!document.querySelector('link[data-closet-tryon-css="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL("src/tryonImageUploadPopup.css");
      link.setAttribute("data-closet-tryon-css", "1");
      document.head.appendChild(link);
    }

    // Inject module script for the popup UI
    if (!document.querySelector('script[data-closet-tryon="1"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = chrome.runtime.getURL("src/tryonImageUploadPopup.js");
      script.setAttribute("data-closet-tryon", "1");
      document.body.appendChild(script);
    }

    // Set up listener for image upload events from the popup
    setupImageUploadListener();
  }

  /**
   * Sets up listener for image upload events from the popup.
   * The popup sends custom DOM events, which we relay to the background script.
   */
  function setupImageUploadListener() {
    document.addEventListener("closet-upload-image", async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { image, mimeType } = customEvent.detail;

      console.log("The Closet: Received image upload request from popup");

      try {
        // Send to background script
        const response = await chrome.runtime.sendMessage({
          action: "uploadImage",
          image,
          mimeType,
        });

        // Send response back to popup
        const responseEvent = new CustomEvent("closet-upload-response", {
          detail: response,
        });
        document.dispatchEvent(responseEvent);
      } catch (error: any) {
        console.error("The Closet: Error uploading image:", error);
        // Send error response back to popup
        const responseEvent = new CustomEvent("closet-upload-response", {
          detail: { success: false, error: error.message || "Upload failed" },
        });
        document.dispatchEvent(responseEvent);
      }
    });
  }

  /**
   * Initialize the extension.
   * @returns {void}
   */
  function init() {
    // Check if we're on a product page
    chrome.runtime.sendMessage({ action: "getUser" }).then((response) => {
      if (response.user) {
        console.log("The Closet: User found:", response.user);
      } else {
        chrome.runtime
          .sendMessage({ action: "signInAnonymously" })
          .then((res) => {
            if (res.user)
              console.log("The Closet: Signed in anonymously:", res.user);
            else
              console.error("The Closet: Anonymous sign-in failed:", res.error);
          });
      }
    });

    if (isProductPage()) {
      injectButtonsContainer();
      console.log("The Closet: Product page detected");
      injectSaveButton();

      if (isApparelPage()) injectTryonButton();
      // Inject the save button

      // Re-check after DOM changes (for SPAs)
      const observer = new MutationObserver(() => {
        if (!document.getElementById("closet-save-btn")) {
          injectSaveButton();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      console.log("The Closet: Not a product page");
    }
  }

  // Run initialization when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
