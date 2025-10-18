import { supabase } from "./supabaseConfig";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Allow JSON import for patterns
import ProductPatterns from "./ProductPatternsUpdated.json";

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

// Listen for messages from content scripts
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

});

// Handle saving a product
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

// Handle removing a product
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

// Handle clearing all products
async function clearAllProducts() {
  try {
    await chrome.storage.local.set({ savedProducts: [] });
    return { success: true, message: "All products cleared successfully" };
  } catch (error: any) {
    console.error("Error clearing all products:", error);
    return { success: false, error: error.message };
  }
}

// Handle image upload
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
        binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
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

async function processTryon(product: ProductInfo) {
  // store the product in the clothing_items table
  const { clothing_id, error } = await saveTryonProduct(product);
  if (error) {
    throw new Error(`Failed to save product: ${error}`);
  }
  // request the edge function to process the clothing id and user image id
  try {
    const userImageId = await chrome.storage.local.get(["userImageId"]);
    const {data, error} = await supabase.functions.invoke("tryon", {
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

async function saveTryonProduct(product: ProductInfo) {
  // get the userId from storage
  const result = await chrome.storage.local.get(["userId"]);
  const userId = result.userId;
  // store the product in the clothing_items table
  const { data, error } = await supabase
    .from("clothing_items")
    .insert([{ user_id: userId, title: product.title, image_url: product.image }])
    .select("id")
    .single();
  if (error){
    return { error: `Error inserting clothing item: ${error.message}` };
  }
  return { clothing_id: data.id };
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
