interface ProductPatternJSON {
  urlPattern: string;
  mouseOverTransition?: boolean;
  selectors: {
    titleSelector: string;
    insertTarget: string;
    mainImage: string;
    priceSelector: string;
    thumbnailList: string;
    thumbnailItem: string;
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
    mouseOverTransition?: boolean;
    selectors: {
      titleSelector: string;
      insertTarget: string;
      mainImage: string;
      priceSelector: string;
      thumbnailList: string;
      thumbnailItem: string;
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

  // Pattern-related helper functions
  /**
   * Initialize the extension.
   * @returns {void}
   */
  async function loadPatterns() {
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
            mouseOverTransition: p.mouseOverTransition ?? false,
            selectors: { ...p.selectors },
            injectTemplate: p.injectTemplate,
          },
        ])
      );
    } catch (e) {
      console.error("The Closet: Error loading product patterns", e);
    }
  }
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
    if (hostname.includes("oldnavy")) return "oldnavy";
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
    const imageList = document.querySelector(pattern.selectors.thumbnailList);

    console.info("The Closet: Detected product elements", {
      title,
      image: imageList,
    });

    return !!(title && imageList);
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

  // Parsing helpers
  /**
   * Extracts and parsed product information from the current page.
   * Resolves relative image URLs to absolute URLs.
   * Adding
   * @returns {ProductInfo | null}
   */
  function extractProductInfo() {
    const site = getSiteIdentifier();
    const pattern = getSitePattern();
    if (!pattern) return null;

    const titleEl = document.querySelector(pattern.selectors.titleSelector);
    let imageEl =
      document.querySelector<HTMLImageElement>(
        'img[data-closet-main-image="1"]'
      ) ??
      document.querySelector<HTMLImageElement>(pattern.selectors.mainImage);

    imageEl?.setAttribute("data-closet-main-image", "1");

    console.info("The Closet: Extracting product info", imageEl);

    // handle an edge case where imageSrc is relative URL
    const imageSrcResolved = resolveRelativeImageUrl(
      imageEl?.getAttribute("src") || "",
      globalThis.location.href
    );

    const priceEl = document.querySelector(pattern.selectors.priceSelector);
    return {
      title: titleEl ? titleEl.textContent.trim() : "Unknown Product",
      image: imageSrcResolved,
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
   * Resolves a relative image URL to an absolute URL.
   * @param imageSrc The relative image URL.
   * @param pageUrl The URL of the page containing the image.
   * @returns The resolved absolute image URL.
   */
  function resolveRelativeImageUrl(imageSrc: string, pageUrl: string): string {
    const absoluteScheme = /^(https?:|data:|blob:)/i;
    if (imageSrc && !absoluteScheme.test(imageSrc)) {
      try {
        imageSrc = new URL(imageSrc, pageUrl).toString();
      } catch (error_) {
        try {
          const base = new URL(pageUrl);
          const path = imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
          imageSrc = `${base.origin}${path}`;
        } catch (innerError) {
          // Fallback: keep original imageSrc if parsing fails; log at debug level
          console.debug(
            "resolveRelativeImageUrl: failed to resolve relative image URL",
            {
              imageSrc,
              pageUrl,
              error_,
              innerError,
            }
          );
        }
      }
    }
    return imageSrc;
  }

  // UI Injection functions
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
      <span>Save</span>
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

    // Create a wrapper group to host the main button and optional dropdown
    const group = document.createElement("div");
    group.id = "closet-tryon-group";
    group.className = "closet-button";

    // Create the main try-on button
    const tryonButton = document.createElement("button");
    tryonButton.id = "closet-tryon-btn";
    tryonButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a.5.5 0 0 1 .5.5V7h5.5a.5.5 0 0 1 0 1H8.5v5.5a.5.5 0 0 1-1 0V8H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/>
      </svg>
      <span>Try On</span>
    `;

    // Main click handler remains the same
    tryonButton.addEventListener("click", async (e: Event) => {
      await handleTryonClick(e);
    });

    group.appendChild(tryonButton);
    buttonContainer.appendChild(group);

    // If userImageId exists, add a small split-dropdown for extra actions (e.g., Replace Image)
    chrome.runtime
      .sendMessage({ action: "getuserImageId" })
      .then((resp) => {
        const userImageId = resp?.userImageId;
        if (userImageId) {
          injectTryonCarotButtonIfDoesntExist(group);
        } else {
          console.error("The Closet: Try-on dropdown not shown (no user image set).");
        }
      })
      .catch((e) => {
        console.warn(
          "The Closet: Failed to check userImageId for dropdown:",
          e
        );
      });

    console.log("The Closet: Try on button injected successfully");
  }
  const injectTryonCarotButtonIfDoesntExist = (group?: HTMLElement) => {
    if (document.getElementById("closet-dropdown-btn")) {
      return;
    }
    if (!group) {
      group = document.getElementById("closet-tryon-group") as HTMLElement;
    }
    // Create dropdown toggle button
    const caretBtn = document.createElement("button");
    caretBtn.type = "button";
    caretBtn.id = "closet-dropdown-btn";
    caretBtn.setAttribute("aria-haspopup", "menu");
    caretBtn.setAttribute("aria-expanded", "false");
    caretBtn.textContent = "▾";

    // Dropdown menu
    const menu = document.createElement("div");
    menu.id = "closet-dropdown-menu";
    menu.style.display = "none";
    menu.setAttribute("role", "menu");

    const menuItem = document.createElement("button");
    menuItem.type = "button";
    menuItem.textContent = "Replace Image";
    menuItem.setAttribute("role", "menuitem");
    menuItem.addEventListener("mouseover", () => {
      menuItem.style.background = "rgba(0, 0, 0, 0.05)";
    });
    menuItem.addEventListener("mouseout", () => {
      menuItem.style.background = "transparent";
    });
    menuItem.addEventListener("click", () => {
      // Close menu first
      menu.style.display = "none";
      caretBtn.setAttribute("aria-expanded", "false");
      // Defer the call to a future-implemented handler to avoid TS errors
      //TODO: implement handleReplaceUserImage in globalThis
    });

    menu.appendChild(menuItem);
    group.appendChild(caretBtn);
    group.appendChild(menu);

    // Toggle menu on caret click
    caretBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const open = menu.style.display !== "none";
      menu.style.display = open ? "none" : "block";
      caretBtn.textContent = open ? "▾" : "▴";
      caretBtn.setAttribute("aria-expanded", open ? "false" : "true");
    });

    // Close on outside click
    const onDocClick = (ev: MouseEvent) => {
      if (!group.contains(ev.target as Node)) {
        menu.style.display = "none";
        caretBtn.setAttribute("aria-expanded", "false");
      }
    };
    document.addEventListener("click", onDocClick);
  };
  /**
   * Helper: show a top-center toast (auto-dismiss)
   * @param message
   */
  const showTopToast = (message: string) => {
    // Ensure container exists
    let container = document.getElementById(
      "closet-toast-container"
    ) as HTMLDivElement | null;
    if (!container) {
      container = document.createElement("div");
      container.id = "closet-toast-container";
      container.style.position = "fixed";
      container.style.top = "16px";
      container.style.left = "50%";
      container.style.transform = "translateX(-50%)";
      container.style.zIndex = "2147483647"; // on top
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "8px";
      container.style.alignItems = "center";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    // Style consistent with app's gradient + readable contrast (error tone)
    toast.style.background =
      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    toast.style.color = "#ffffff";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "8px";
    toast.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    toast.style.transition = "opacity 200ms ease, transform 200ms ease";
    toast.style.pointerEvents = "auto";

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Auto dismiss
    const remove = () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      setTimeout(() => {
        toast.remove();
        if (container && container.childElementCount === 0) {
          container.remove();
        }
      }, 220);
    };
    setTimeout(remove, 3500);
  };
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

    if (pattern.mouseOverTransition) {
      const replaceImageToTryon = () => {
        // Only apply if main image isn't already the try-on image
        const mainImageEls = document.querySelectorAll<HTMLImageElement>(
          pattern.selectors.mainImage
        );
        for (const mainImageEl of mainImageEls) {
          if (mainImageEl && mainImageEl.getAttribute("src") !== imageUrl) {
            mainImageEl.dataset.originalSrc =
              mainImageEl.getAttribute("src") || "";
            mainImageEl.src = imageUrl;
          }
        }
        console.log("The Closet: Try-on image hover - main image replaced.");
      };
      const restoreOriginalImage = () => {
        const mainImageEls = document.querySelectorAll<HTMLImageElement>(
          pattern.selectors.mainImage
        );
        for (const mainImageEl of mainImageEls) {
          if (mainImageEl) {
            const original = mainImageEl.dataset.originalSrc || "";
            if (original) {
              mainImageEl.src = original;
            }
          }
        }
      };
      // Fallback when some nested elements intercept hover; mouseover bubbles
      node.addEventListener("mouseover", (_ev: Event) => {
        _ev.preventDefault();
        replaceImageToTryon();
      });
      for (const elem of listEl.querySelectorAll(
        pattern.selectors.thumbnailItem
      )) {
        elem.addEventListener("mouseover", (_ev: Event) => {
          _ev.preventDefault();
          restoreOriginalImage();
        });
      }
      replaceImageToTryon();
    }

    // Remove any existing injected try-on images to avoid duplicates
    const existingInjected = listEl.querySelectorAll(
      '[data-closet-injected="1"]'
    );
    for (const el of existingInjected) {
      el.remove();
    }

    // Append to the thumbnail list
    listEl.insertBefore(node, listEl.firstChild);

    const tryonSpan = document.querySelector<HTMLButtonElement>(
      "#closet-tryon-btn > span"
    );
    if (tryonSpan) tryonSpan.textContent = "Try On Again";
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

  // Event Handlers
  /**
   * Checks if userImageId exists by sending a message to the background script.
   * Message: `{ action: "getuserImageId" }`
   * If it exists, call `processTryon()` else call `injectTryonImageUploadPopup()`.
   * @param event The click event.
   * @returns {Promise<void>}
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
    const tryonButton =
      document.querySelector<HTMLButtonElement>("#closet-tryon-btn");
    const originalHTML = tryonButton?.innerHTML;
    let animTimer: ReturnType<typeof setInterval> | null = null;

    // Start a simple "Trying..." dots animation on the button textContent
    const startTryingAnimation = () => {
      if (!tryonButton) return;
      let dots = 0; // 0..2 -> 1,2,3 dots visual
      const tick = () => {
        dots = (dots % 3) + 1;
        tryonButton.textContent = `Trying${".".repeat(dots)}`;
      };
      tick();
      animTimer = globalThis.setInterval(tick, 400);
    };

    const stopTryingAnimation = () => {
      if (animTimer !== null) {
        globalThis.clearInterval(animTimer);
        animTimer = null;
      }
      if (tryonButton && originalHTML != null) {
        tryonButton.innerHTML = originalHTML;
      }
    };

    tryonButton?.setAttribute("disabled", "true");
    try {
      let userImageId: string | null | undefined = undefined;
      const resp = await chrome.runtime.sendMessage({
        action: "getuserImageId",
      });
      userImageId = resp?.userImageId;

      if (userImageId) {
        try {
          // If a user image is already present, proceed with try-on flow without showing upload UI
          startTryingAnimation();
          await processTryon();
        } catch (e) {
          console.error("The Closet: processTryon failed:", e);
          // Optional: surface a user message or fallback to upload
          // await injectTryonImageUploadPopup();
        } finally {
          // Ensure animation stops regardless of success or failure
          stopTryingAnimation();
          injectTryonCarotButtonIfDoesntExist();
        }
      } else {
        // No user image yet; inject upload popup
        injectTryonImageUploadPopup();
      }
    } catch (e) {
      console.error("The Closet: handleTryonClick error:", e);
    } finally {
      tryonButton?.removeAttribute("disabled");
    }
  }

  // Event Controllers
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
    console.log("The Closet: Try-on processing successful", response);
    // If a public URL is returned, inject the generated image into the page's thumbnail list
    if (response.signedUrl) {
      const injected = injectTryonImage(response.signedUrl as string);
      if (!injected) {
        console.warn(
          "The Closet: injectTryonImage failed or not supported for this site."
        );
      }
    } else if (response.limitExceeded) {
      showTopToast("Image unsupported. Please upload a new photo.");
    }
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
        handleTryonClick(new Event("click"));
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
   * Returns a signed URL of an existing try-on image for the current product if it exists.
   * Calls `injectTryonImage()` to insert the image into the page if found.
   * @returns {Promise<void>}
   */
  async function loadTryonImageIfExists() {
    const currentProduct = extractProductInfo();
    if (!currentProduct) return;
    chrome.runtime
      .sendMessage({ action: "getTryonImageIfExists", product: currentProduct })
      .then((response) => {
        if (response.success && response.signedUrl) {
          injectTryonImage(response.signedUrl as string);
        }
      })
      .catch((e) => {
        console.error("The Closet: Error loading existing try-on image", e);
      });
  }

  /**
   * Main initialization function.
   * Loads product patterns, checks if on a product page, and injects UI elements accordingly.
   * @returns {Promise<void>}
   */
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
      const productPageInit = async () => {
        injectButtonsContainer();
        console.log("The Closet: Product page detected");
        injectSaveButton();

        if (isApparelPage()) {
          injectTryonButton();
          await loadTryonImageIfExists();
        }
      };
      await productPageInit();
      // Inject the save button

      // Re-check after DOM changes (for SPAs)
      const observer = new MutationObserver(async () => {
        if (!document.getElementById("closet-save-btn")) {
          await productPageInit();
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
