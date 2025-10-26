import { supabase } from "./supabaseConfig";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Allow JSON import for patterns
import ProductPatterns from "./ProductPatterns.json";

// Product information schema for saving the product
interface ProductInfo {
  title: string;
  image: string;
  price: string;
  url: string;
  site: string;
  timestamp: string;
}
// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("The Closet extension installed");

    // Initialize storage
    chrome.storage.local.set({
      savedProducts: [],
    });
  } else if (details.reason === "update") {
    console.log("The Closet extension updated");
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //Messages for save functionality
  if (request.action === "saveProduct") {
    handleSaveProduct(request.product)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  if (request.action === "getProducts") {
    chrome.storage.local.get(["savedProducts"], (result) => {
      sendResponse({ products: result.savedProducts || [] });
    });
    return true;
  }
  if (request.action === "getProductsPattern") {
    try {
      sendResponse({ success: true, patterns: ProductPatterns });
    } catch (error: any) {
      sendResponse({ success: false, error: error?.message || String(error) });
    }
    return true;
  }
  if (request.action === "removeProduct") {
    handleRemoveProduct(request.product)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  if (request.action === "clearAll") {
    clearAllProducts()
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  // Messages for auth functionality
  if (request.action === "signInAnonymously") {
    supabase.auth.signInAnonymously().then(({ data, error }) => {
      if (error) {
        sendResponse({ user: null, error });
      } else {
        // Insert user into "users" table if not exists
        supabase
          .from("users")
          .insert([{ auth_id: data.user?.id }])
          .then(({ error }) => {
            if (error) {
              console.error("Error inserting user:", error);
              sendResponse({ user: null, error });
            } else {
              // Fetch and save the user ID from "users" table
              supabase
                .from("users")
                .select("id")
                .eq("auth_id", data.user?.id)
                .then(({ data, error }) => {
                  if (error) {
                    console.error("Error fetching user ID:", error);
                  } else if (data && data.length > 0) {
                    const userId = data[0].id;
                    chrome.storage.local.set({ userId });
                  }
                });
              sendResponse({ user: data.user });
            }
          });
      }
    });
    return true;
  }
  if (request.action === "getUser") {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        sendResponse({ user: null, error });
      } else {
        sendResponse({ user: data.user });
      }
    });
    return true;
  }
  if (request.action === "signOut") {
    supabase.auth.signOut().then(({ error }) => {
      if (error) {
        sendResponse({ success: false, error });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // Messages for image upload functionality
  if (request.action === "uploadImage") {
    const { image, mimeType } = request;
    console.log("Received image upload request:", {
      hasImage: !!image,
      mimeType,
    });
    handleImageUpload(image, mimeType)
      .then((response) => sendResponse(response))
      .catch((error) =>
        sendResponse({ success: false, error: error?.message || String(error) })
      );
    return true; // Keep message channel open for async response
  }
  if (request.action === "getuserImageId") {
    chrome.storage.local.get(["userImageId"], (result) => {
      sendResponse({ userImageId: result.userImageId || null });
    });
    return true;
  }

  // Message for try-on functionality
  if (request.action === "processTryon") {
    processTryon(request.product)
      .then((data) => sendResponse({ success: true, ...data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  if (request.action === "getTryonImageIfExists") {
    getTryonImageIfExists(request.product)
      .then((data) => sendResponse(data))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Save Product Feature Handlers
/**
 * Handles saving a product to the user's saved products list in Chrome storage `savedProducts`.
 * @param product The product information to save.
 * @returns A promise that resolves to the result of the save operation.
 */
async function handleSaveProduct(product: ProductInfo) {
  try {
    const result = await chrome.storage.local.get(["savedProducts"]);
    const savedProducts = result.savedProducts || [];

    // Check if product already exists
    const existingIndex = savedProducts.findIndex(
      (p: ProductInfo) => p.url === product.url
    );

    if (existingIndex >= 0) {
      savedProducts[existingIndex] = product;
    } else {
      savedProducts.unshift(product);
    }

    await chrome.storage.local.set({ savedProducts: savedProducts });

    return { success: true, message: "Product saved successfully" };
  } catch (error: any) {
    console.error("Error saving product:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Handles removing a product from the user's saved products list in Chrome storage `savedProducts`.
 * @param product The product information to remove.
 * @returns A promise that resolves to the result of the remove operation.
 */
async function handleRemoveProduct(product: ProductInfo) {
  try {
    const result = await chrome.storage.local.get(["savedProducts"]);
    const savedProducts = result.savedProducts || [];
    const updatedProducts = savedProducts.filter(
      (p: ProductInfo) => p.url !== product.url
    );
    await chrome.storage.local.set({ savedProducts: updatedProducts });
    return { success: true, message: "Product removed successfully" };
  } catch (error: any) {
    console.error("Error removing product:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Handles clearing all products from the user's saved products list in Chrome storage `savedProducts`.
 * @returns A promise that resolves to the result of the clear operation.
 */
async function clearAllProducts() {
  try {
    await chrome.storage.local.set({ savedProducts: [] });
    return { success: true, message: "All products cleared successfully" };
  } catch (error: any) {
    console.error("Error clearing all products:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Handles uploading an image to the user's storage.
 * @param imageData The base64-encoded image data.
 * @param mimeType The MIME type of the image (e.g., "image/png").
 * @returns A promise that resolves to the result of the upload operation.
 */
async function handleImageUpload(imageData: string, mimeType: string) {
  try {
    if (!imageData || !mimeType) {
      return { success: false, error: "Missing image data or mimeType" };
    }

    const userId = (await chrome.storage.local.get(["userId"])).userId;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Insert DB row to reserve an id
    const { data: inserted, error: insertError } = await supabase
      .from("user_images")
      .insert([{ user_id: userId, mime_type: mimeType }])
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting user_images row:", insertError);
      return {
        success: false,
        error: `DB insert failed: ${insertError.message}`,
      };
    }
    const imageId = inserted?.id;
    if (!imageId) {
      return { success: false, error: "Failed to obtain image id" };
    }

    // Prepare binary payload
    let binary: Uint8Array;
    try {
      if (imageData.startsWith("data:")) {
        const base64Data = imageData.split(",")[1];
        if (!base64Data) throw new Error("Invalid data URL format");
        binary = Uint8Array.from(
          atob(base64Data),
          (c) => c.codePointAt(0) ?? 0
        );
      } else {
        const res = await fetch(imageData);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        binary = new Uint8Array(buf);
      }
    } catch (e: any) {
      console.error("Error decoding image data:", e);
      return { success: false, error: "Failed to decode image data" };
    }

    // Upload to storage (allow upsert in case of retry)
    const { error: uploadError } = await supabase.storage
      .from("user_uploads")
      .upload(`${userId}/${imageId}`, binary, {
        contentType: mimeType,
        upsert: true, // tolerate re-uploads if supported by client
      });
    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`,
      };
    }

    // Update DB with storage path
    const { error: updateError } = await supabase
      .from("user_images")
      .update({ image_url: `${userId}/${imageId}` })
      .eq("id", imageId);
    if (updateError) {
      console.error("Error updating image URL:", updateError);
      return {
        success: false,
        error: `DB update failed: ${updateError.message}`,
      };
    }

    chrome.storage.local.set({ userImageId: `${imageId}` });

    return { success: true, imageId };
  } catch (error: any) {
    console.error("handleImageUpload error:", error);
    return { success: false, error: error?.message || String(error) };
  }
}

// Try-On Feature Handlers
/**
 * Processes the virtual try-on for a clothing product by invoking the edge function `tryon`.
 * @param product The clothing product information.
 * @returns A promise that resolves to the result of the try-on process.
 */
async function processTryon(product: ProductInfo) {
  // store the product in the clothing_items table
  const { clothing_id, error } = await saveOrFetchTryonProduct(product);
  if (error) {
    throw new Error(`Failed to save product: ${error}`);
  }
  // request the edge function to process the clothing id and user image id
  try {
    const userImageId = await chrome.storage.local.get(["userImageId"]);
    const { data, error } = await supabase.functions.invoke("tryon", {
      body: { clothing_id, user_image_id: userImageId.userImageId },
    });
    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }
    return data;
  } catch (error) {
    throw new Error(`Try-on function invocation failed: ${error}`);
  }
}
/**
 * Saves or fetches a try-on product for the user.
 * @param product The clothing product information.
 * @returns The clothing item ID or an error message.
 */
async function saveOrFetchTryonProduct(product: ProductInfo) {
  // get the userId from storage
  const { userId } = await chrome.storage.local.get(["userId"]);
  if (!userId) {
    return { error: "User not authenticated" };
  }
  // Not found, insert a new record
  const { data, error } = await supabase
    .from("clothing_items")
    .insert([
      { user_id: userId, title: product.title, image_url: product.image },
    ])
    .select("id")
    .single();

  if (error) {
    if(error.code === "23505") {
      // unique violation, fetch the existing record
      const { data: existingData, error: fetchError } = await supabase
        .from("clothing_items")
        .select("id")
        .eq("user_id", userId)
        .eq("image_url", product.image)
        .single();
      if(fetchError) {
        return { error: `Error fetching existing clothing item: ${fetchError.message}` };
      }
      return { clothing_id: existingData.id };
    }
    return { error: `Error inserting clothing item: ${error.message}` };
  }
  return { clothing_id: data.id };
}
/**
 * Get the try-on image URL if it exists for the given product.
 * @param product The product information.
 * @returns The try-on image URL or an error message.
 */
async function getTryonImageIfExists(product: ProductInfo) {
  // check if clothing item exists for this user and product image
  const userId = (await chrome.storage.local.get(["userId"])).userId;
  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }
  const { data, error } = await supabase
      .from("clothing_items")
      .select("id")
      .eq("user_id", userId)
      .eq("image_url", product.image)
      .single();
  console.log("Clothing item lookup image :", product.image);
  if (error || !data) {
    return { success: false, error: error?.message || "Image not found" };
  }

  // clothing item exists, fetch the try-on image from tryon_results table
  const clothingId = data.id;
  const userImageId = (await chrome.storage.local.get(["userImageId"])).userImageId;
  const { data: tryonData, error: tryonError } = await supabase
      .from("tryon_results")
      .select("image_url")
      .eq("clothing_id", clothingId)
      .eq("user_image_id", userImageId)
      .single();
  if (tryonError || !tryonData) {
    return { success: false, error: tryonError?.message || "Try-on image not found" };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("tryon_results").createSignedUrl(tryonData.image_url, 365 * 24 * 60 * 60);
  if (signedUrlError) {
    return { success: false, error: signedUrlError.message };
  }
  return { success: true, signedUrl: signedUrlData.signedUrl };
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.savedProducts) {
    console.log(
      "Saved products updated:",
      changes.savedProducts.newValue?.length || 0,
      "products"
    );
  }
});
