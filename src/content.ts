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
    }
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
    return "n/a";
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
    const site = getSiteIdentifier();

    if (siteExtension === "n/a" || site === "n/a") return null;

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
   * The product page is determined by matching URL patterns and checking for title and image DOM elements.
   * @returns {boolean} 
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
   * Parses the DOM content to retrieve product details.
   * @returns {ProductInfo | null}
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

  /**
   * Injects the button container with id "closet-btns-container" as a next sibling to the insertTarget element.
   * @returns {void}
   */
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
   * Injects a button with id "closet-save-btn" into the product page.
   * DOM Location is child to the button container with id "closet-btns-container".
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
    
    const button = event.currentTarget as HTMLButtonElement;
    const originalContent = button.innerHTML;
    
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
        // Show processing state
        button.classList.add("closet-saving");
        button.disabled = true;
        button.innerHTML = `
          <svg class="closet-spinner" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30" />
          </svg>
          <span>Processing Try-On...</span>
        `;
        
        try {
          // If a user image is already present, proceed with try-on flow without showing upload UI
          await processTryon();
          
          // Show success state
          button.classList.remove("closet-saving");
          button.classList.add("closet-saved");
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span>Try-On Complete!</span>
          `;

          // Reset button after 2 seconds
          setTimeout(() => {
            button.disabled = false;
            button.classList.remove("closet-saved");
            button.innerHTML = originalContent;
          }, 2000);
        } catch (e) {
          console.error("The Closet: processTryon failed:", e);
          
          // Show error state
          button.classList.remove("closet-saving");
          button.classList.add("closet-error");
          button.innerHTML = `
            <span>Try-On Failed! Try again</span>
          `;

          // Reset button after 2 seconds
          setTimeout(() => {
            button.disabled = false;
            button.classList.remove("closet-error");
            button.innerHTML = originalContent;
          }, 2000);
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
   * Finds the Amazon image carousel/gallery container element.
   * Tries multiple selectors to support different Amazon page layouts.
   * @returns {HTMLElement | null} The carousel container element, or null if not found.
   */
  function findAmazonImageCarousel() {
    const site = getSiteIdentifier();
    if (site !== "amazon") {
      console.warn("The Closet: Not on Amazon, cannot embed try-on image");
      return null;
    }

    // Try to find the image carousel/gallery container
    // Amazon uses different layouts, so we try multiple selectors
    const selectors = [
      "#altImages ul",                           // Desktop thumbnail list
      "#imageBlock_feature_div #altImages",      // Alternative desktop layout
      ".a-carousel-viewport",                     // Carousel viewport
      "#imageBlock",                              // Main image block container
      "#main-image-container",                    // Another common container
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`The Closet: Found image carousel using selector: ${selector}`);
        return container as HTMLElement;
      }
    }

    console.warn("The Closet: Could not find Amazon image carousel container");
    return null;
  }

  /**
   * Creates a try-on image element styled to match Amazon's product images.
   * @param {string} imageUrl - The URL of the try-on image to display.
   * @returns {HTMLElement} The created image element wrapped in appropriate containers.
   */
  function createTryonImageElement(imageUrl: string) {
    const site = getSiteIdentifier();
    
    if (site === "amazon") {
      // Create a list item similar to Amazon's thumbnail structure
      const li = document.createElement("li");
      li.className = "a-spacing-small item imageThumbnail a-declarative";
      li.setAttribute("data-closet-tryon", "1"); // Mark as our injected element
      li.style.position = "relative"; // For badge positioning
      
      const span = document.createElement("span");
      span.className = "a-list-item";
      
      const spanInner = document.createElement("span");
      spanInner.className = "a-button a-button-thumbnail a-button-toggle";
      
      const spanInnerInner = document.createElement("span");
      spanInnerInner.className = "a-button-inner";
      
      const input = document.createElement("input");
      input.className = "a-button-input";
      input.type = "submit";
      
      const img = document.createElement("img");
      img.alt = "Virtual Try-On Result";
      img.src = imageUrl;
      img.className = "a-dynamic-image";
      img.style.maxHeight = "40px"; // Match Amazon thumbnail size
      img.style.maxWidth = "40px";
      
      // Add a small badge to indicate this is a try-on result
      const badge = document.createElement("span");
      badge.textContent = "Try-On";
      badge.style.position = "absolute";
      badge.style.top = "2px";
      badge.style.left = "2px";
      badge.style.backgroundColor = "#667eea";
      badge.style.color = "white";
      badge.style.fontSize = "8px";
      badge.style.padding = "2px 4px";
      badge.style.borderRadius = "3px";
      badge.style.fontWeight = "bold";
      badge.style.zIndex = "10";
      badge.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      
      spanInnerInner.appendChild(input);
      spanInnerInner.appendChild(img);
      spanInner.appendChild(spanInnerInner);
      span.appendChild(spanInner);
      li.appendChild(span);
      li.appendChild(badge);
      
      // Add click handler to show the try-on image in the main viewer
      li.addEventListener("click", () => {
        const mainImage = document.querySelector("#landingImage, #imgTagWrapperId img") as HTMLImageElement;
        if (mainImage) {
          mainImage.src = imageUrl;
          mainImage.alt = "Virtual Try-On Result";
        }
      });
      
      return li;
    }

    // Fallback: create a simple image element for non-Amazon sites
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.marginTop = "10px";
    container.setAttribute("data-closet-tryon", "1");
    
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Virtual Try-On Result";
    img.className = "closet-tryon-image";
    img.style.maxWidth = "100%";
    img.style.border = "2px solid #667eea";
    img.style.borderRadius = "8px";
    img.style.display = "block";
    
    // Add a badge to indicate this is a try-on result
    const badge = document.createElement("span");
    badge.textContent = "Virtual Try-On Result";
    badge.style.position = "absolute";
    badge.style.top = "10px";
    badge.style.left = "10px";
    badge.style.backgroundColor = "#667eea";
    badge.style.color = "white";
    badge.style.fontSize = "12px";
    badge.style.padding = "4px 8px";
    badge.style.borderRadius = "4px";
    badge.style.fontWeight = "bold";
    badge.style.zIndex = "10";
    badge.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    
    container.appendChild(img);
    container.appendChild(badge);
    
    return container;
  }

  /**
   * Embeds the try-on image into the product page DOM.
   * For Amazon, injects into the image carousel/gallery.
   * For other sites, inserts after the main product image.
   * @param {string} imageUrl - The URL of the try-on image to embed.
   * @returns {void}
   */
  function embedTryonImage(imageUrl: string) {
    // Check if try-on image is already embedded
    const existingTryonImage = document.querySelector('[data-closet-tryon="1"]');
    if (existingTryonImage) {
      console.log("The Closet: Try-on image already embedded, updating...");
      existingTryonImage.remove();
    }

    const site = getSiteIdentifier();
    
    if (site === "amazon") {
      // Find the carousel container
      const carousel = findAmazonImageCarousel();
      if (!carousel) {
        console.warn("The Closet: Could not find carousel, falling back to simple injection");
        fallbackImageInjection(imageUrl);
        return;
      }

      // Create and inject the try-on image element
      const tryonElement = createTryonImageElement(imageUrl);
      
      // Insert as the first item in the carousel
      if (carousel.firstChild) {
        carousel.insertBefore(tryonElement, carousel.firstChild);
      } else {
        carousel.appendChild(tryonElement);
      }
      
      console.log("The Closet: Try-on image successfully embedded into carousel");
    } else {
      // For non-Amazon sites, use fallback injection
      fallbackImageInjection(imageUrl);
    }
  }

  /**
   * Fallback method to inject try-on image when carousel is not found.
   * Inserts the image after the main product image.
   * @param {string} imageUrl - The URL of the try-on image to embed.
   * @returns {void}
   */
  function fallbackImageInjection(imageUrl: string) {
    const pattern = getSitePattern();
    if (!pattern) return;

    const mainImage = document.querySelector(pattern.imageSelector);
    if (!mainImage || !mainImage.parentElement) {
      console.warn("The Closet: Could not find main product image for fallback injection");
      return;
    }

    const tryonElement = createTryonImageElement(imageUrl);
    mainImage.parentElement.insertBefore(tryonElement, mainImage.nextSibling);
    
    console.log("The Closet: Try-on image injected using fallback method");
  }

  /**
   * Processes the try-on request by extracting product info via `extractProductInfo()`.  
   * Sends the product info to the background script for processing.  
   * Message: `{ action: "processTryon", product: ProductInfo }`  
   * On success, embeds the try-on image into the product page DOM.
   * @returns {Promise<void>}
   */
  async function processTryon() {
    const product = extractProductInfo();
    if (!product) throw new Error("Failed to extract product info");
    // Send to background script
    console.log("The Closet: Sending product for try-on processing", { product });
    const response = await chrome.runtime.sendMessage({
      action: "processTryon",
      product,
    });
    if (!response.success) {
      throw new Error("Try-on processing failed: " + response.error);
    }
    console.log("The Closet: Try-on processing successful", response.publicUrl);
    
    // Embed the try-on image into the product page
    if (response.publicUrl) {
      embedTryonImage(response.publicUrl);
    }
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
