interface ProductPatternJSON {
  urlPattern: string;
  selectors: {
    titleSelector: string;
    insertTarget: string;
    mainImage: string;
    priceSelector: string;
    thumbnailList?: string;
    thumbnailItem?: string;
    videoThumbnail?: string;
  };
  injectTemplate?: string;
}
let PATTERNS_JSON: Record<string, ProductPatternJSON> | null = null;

// Content script to detect product pages and add save button
(function () {
  // Product page detection patterns for different e-commerce sites
  interface ProductPattern {
    urlPattern: RegExp;
    selectors: {
      titleSelector: string;
      insertTarget: string;
      mainImage: string;
      priceSelector: string;
      thumbnailList?: string;
      thumbnailItem?: string;
      videoThumbnail?: string;
    };
    injectTemplate?: string; // HTML snippet to inject a thumbnail/button
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
  // Helper to convert a pattern string like "/foo/i" into a RegExp
  function regexFromString(pattern: string): RegExp {
    // Expect format "/.../flags?"; fall back to whole string if not wrapped
    if (pattern.startsWith("/") && pattern.lastIndexOf("/") > 0) {
      const lastSlash = pattern.lastIndexOf("/");
      const body = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      return new RegExp(body, flags);
    }
    return new RegExp(pattern);
  }

  // Will be populated after fetching from background
  let PRODUCT_PATTERNS: Record<string, ProductPattern> = {};

  /**
   * Detects the current e-commerce site based on the window's hostname.
   *
   * @returns {string} The detected site identifier: 'amazon', 'ebay', 'walmart', 'target', 'etsy', or 'generic' if none match.
   */
  function getSiteIdentifier() {
    const hostname = globalThis.location.hostname;
    if (hostname.includes("amazon")) return "amazon";
    if (hostname.includes("ebay")) return "ebay";
    if (hostname.includes("walmart")) return "walmart";
    if (hostname.includes("target")) return "target";
    if (hostname.includes("etsy")) return "etsy";
    if (hostname.includes("shopify")) return "shopify";
    if (hostname.includes("hm.com")) return "hm";
    return "n/a";
  }
  /**
   * Gets the product pattern for the current site and extension.
   * Returns null if no valid pattern is found.
   * @returns {ProductPattern | null}
   */
  function getSitePattern() {
    const site = getSiteIdentifier();
    if (site === "n/a") {
      return null;
    }

    const pattern = PRODUCT_PATTERNS[site];
    if (!pattern) {
      return null;
    }
    if (!pattern.urlPattern.test(globalThis.location.href)) {
      return null;
    }

    return pattern;
  }
  /**
   * Checks if the current page is a product page.
   * The product page is determined by matching URL patterns and checking for title and image DOM elements.
   * @returns {boolean}
   */
  function isProductPage() {
    const pattern = getSitePattern();
    if (!pattern) return false;
    console.info("The Closet: Detected site pattern", pattern);

    // Check if product elements exist
    const title = document.querySelector(pattern.selectors.titleSelector);
    const image = document.querySelector(pattern.selectors.mainImage);

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

    const titleEl = document.querySelector(pattern.selectors.titleSelector);
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
   * Parses the DOM content to retrieve product details.
   * @returns {ProductInfo | null}
   */
  function extractProductInfo() {
    const site = getSiteIdentifier();
    const pattern = getSitePattern();
    if (!pattern) return null;

    const titleEl = document.querySelector(pattern.selectors.titleSelector);
    const imageEl = document.querySelector(pattern.selectors.mainImage);
    const priceEl = document.querySelector(pattern.selectors.priceSelector);
    return {
      title: titleEl ? titleEl.textContent.trim() : "Unknown Product",
      image: imageEl ? imageEl.getAttribute("src") : "",
      price: (function () {
        const text = priceEl?.textContent ?? "";
        const re = /\$\d+(\.\d{2})?/;
        const m = re.exec(text);
        return m ? m[0] : "N/A";
      })(),
      url: globalThis.location.href,
      site: site,
      timestamp: new Date().toISOString(),
    } as ProductInfo;
  }
  /**
   * Injects the button container with `#closet-btns-container` as a next sibling to the insertTarget element.
   * @returns {void}
   */
  function injectButtonsContainer() {
    // Check if container already exists
    if (document.getElementById("closet-btns-container")) {
      return;
    }

    const pattern = getSitePattern();
    if (!pattern) return;

    const targetElement = document.querySelector(
      pattern.selectors.insertTarget
    );

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
   * Injects a button `#closet-save-btn` into the product page.
   * DOM Location is child to the button container with `#closet-btns-container`.
   * Click event is handled by handleSaveClick.
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
  /**
   * Injects a button `#closet-tryon-btn` into the product page.
   * DOM Location is child to the button container `#closet-btns-container`.
   * Click event is handled by `handleTryonClick`.
   * @returns {void}
   */
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
   * Gets the product info by calling `extractProductInfo()`.
   * Sends a message to the background script to save the current product.
   * Message: `{ action: "saveProduct", product: ProductInfo }`
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
  /**
   * Checks if userImageId exists by sending a message to the background script.
   * Message: `{ action: "getuserImageId" }`
   * If it exists, call `processTryon()` else call `injectTryonImageUploadPopup()`.
   * @param event The click event.
   * @returns {Promise<void>}
   */
  async function handleTryonClick(event: Event) {
    event.preventDefault();
    try {
      let userImageId: string | null | undefined = undefined;
      try {
        const resp = await chrome.runtime.sendMessage({
          action: "getuserImageId",
        });
        userImageId = resp?.userImageId;
      } catch (e) {
        console.error(
          "The Closet: Failed to get userImageId; will show upload popup as fallback.",
          e
        );
      }

      if (userImageId) {
        try {
          // If a user image is already present, proceed with try-on flow without showing upload UI
          await processTryon();
        } catch (e) {
          console.error("The Closet: processTryon failed:", e);
          // Optional: surface a user message or fallback to upload
          // await injectTryonImageUploadPopup();
        }
        return;
      }
      // No user image yet; inject upload popup
      injectTryonImageUploadPopup();
    } catch (e) {
      console.error("The Closet: handleTryonClick error:", e);
    }
  }
  /**
   * Processes the try-on request by extracting product info via `extractProductInfo()`.
   * Sends the product info to the background script for processing.
   * Message: `{ action: "processTryon", product: ProductInfo }`
   * @returns {Promise<void>}
   */
  async function processTryon() {
    const product = extractProductInfo();
    if (!product) throw new Error("Failed to extract product info");
    // Send to background script
    console.log("The Closet: Sending product for try-on processing", {
      product,
    });
    const response = await chrome.runtime.sendMessage({
      action: "processTryon",
      product,
    });
    if (!response.success) {
      throw new Error("Try-on processing failed: " + response.error);
    }
    console.log("The Closet: Try-on processing successful", response.publicUrl);
    // If a public URL is returned, inject the generated image into the page's thumbnail list
    if (response.publicUrl) {
      const injected = injectTryonImage(response.publicUrl as string);
      if (!injected) {
        console.warn(
          "The Closet: injectTryonImage failed or not supported for this site."
        );
      }
    }
  }

  /**
   * Builds and injects a try-on image element into the product's thumbnail list using the site's injectTemplate.
   * The template placeholders like {{imageUrl}}, {{uniqueId}}, {{posInSet}}, {{setSize}}, {{timestamp}}, {{index}}
   * will be replaced with appropriate values prior to insertion.
   *
   * @param imageUrl The public URL of the generated try-on image.
   * @returns true if injection succeeded; false otherwise.
   */
  function injectTryonImage(imageUrl: string): boolean {
    const pattern = getSitePattern();
    if (!pattern) {
      return false;
    }

    const template = pattern.injectTemplate;
    const listSelector = pattern.selectors.thumbnailList;
    if (!template || !listSelector) {
      // No injection template or no list container selector set for this site
      return false;
    }

    const listEl = document.querySelector(listSelector);
    if (!listEl) {
      console.warn(
        "The Closet: Thumbnail list element not found for selector:",
        listSelector
      );
      return false;
    }

    // Determine current count to compute posInSet/setSize and index
    let existingCount = 0;
    if (pattern.selectors.thumbnailItem) {
      existingCount = listEl.querySelectorAll(
        pattern.selectors.thumbnailItem
      ).length;
    } else if ((listEl as HTMLElement).children) {
      existingCount = (listEl as HTMLElement).children.length;
    }

    const posInSet = existingCount + 1; // 1-based position after insertion
    const setSize = posInSet; // total size after insertion equals new position as we're appending
    const uniqueId = `closet_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const timestamp = String(Date.now());
    const index = String(existingCount); // zero-based index for some templates

    const values: Record<string, string> = {
      imageUrl,
      uniqueId,
      posInSet: String(posInSet),
      setSize: String(setSize),
      timestamp,
      index,
    };

    // Replace {{placeholders}} (with or without surrounding spaces) using simple string replaceAll
    let html = template;
    for (const [k, v] of Object.entries(values)) {
      // common form without spaces
      html = html.replaceAll(`{{${k}}}`, v);
      // tolerate optional single spaces inside braces
      html = html.replaceAll(`{{ ${k} }}`, v);
    }

    // Create element from HTML string
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const node = wrapper.firstElementChild as HTMLElement | null;
    if (!node) {
      return false;
    }
    node.dataset.closetInjected = "1";

    //TODO: Add on click event here to change the main image to this try-on image
    node.addEventListener("click", () => {
      const mainImageEl = document.querySelector(
        pattern.selectors.mainImage
      ) as HTMLImageElement;
      if (mainImageEl) {
        mainImageEl.src = imageUrl;
      } else {
        console.warn("The Closet: Main image element not found for selector:", pattern.selectors.mainImage);
      }
    });

    // Append to the thumbnail list
    listEl.appendChild(node);
    console.log("The Closet: Injected try-on image into thumbnail list.");
    return true;
  }
  /**
   * Injects the popup in container `#closet-tryon-popup-root`.
   * Injects CSS from `"src/tryonImageUploadPopup.css"` with attribute `data-closet-tryon-css="1"`.
   * Injects module script from `"src/tryonImageUploadPopup.js"` with attribute `data-closet-tryon="1"`.
   * Sets up listener for image upload events from the popup by calling `setupImageUploadListener()`.
   * @returns {void}
   */
  function injectTryonImageUploadPopup() {
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
    if (!document.getElementById("closet-tryon-css")) {
      const link = document.createElement("link");
      link.id = "closet-tryon-css";
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL("src/tryonImageUploadPopup.css");
      link.dataset.closetTryonCss = "1";
      document.head.appendChild(link);
    }

    // Inject module script for the popup UI
    if (!document.getElementById("closet-tryon-script")) {
      const script = document.createElement("script");
      script.id = "closet-tryon-script";
      script.type = "module";
      script.src = chrome.runtime.getURL("src/tryonImageUploadPopup.js");
      script.dataset.closetTryon = "1";
      document.body.appendChild(script);
    }

    // Set up listener for image upload events from the popup
    setupImageUploadListener();
  }
  /**
   * Sets up a listener for `"closet-upload-image"`, an event dispatched from the popup.
   * Event.detail should contain `{ image: string, mimeType: string }`.
   * On receiving the event, it sends the image data to the background script for uploading.
   * Message: `{ action: "uploadImage", image: string, mimeType: string }`
   * After upload, it dispatches a `"closet-upload-response"` event back to the popup with the result.
   * @returns {void}
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
  async function loadPatterns(): Promise<void> {
    if (PATTERNS_JSON) return; // already loaded
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getProductsPattern",
      });
      if (!response?.success || !response?.patterns) {
        console.error("The Closet: Failed to load product patterns", response);
        return;
      }
      PATTERNS_JSON = response.patterns as Record<string, ProductPatternJSON>;
      PRODUCT_PATTERNS = Object.fromEntries(
        Object.entries(PATTERNS_JSON).map(([site, p]) => [
          site,
          {
            urlPattern: regexFromString(p.urlPattern),
            selectors: { ...p.selectors },
            injectTemplate: p.injectTemplate,
          },
        ])
      );
    } catch (e) {
      console.error("The Closet: Error loading product patterns", e);
    }
  }
  async function init() {
    // Ensure patterns are loaded first
    await loadPatterns();
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
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
