export const chromeStorageAdapter = {
  async getItem(key: any) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res[key] ?? null));
    });
  },
  async setItem(key: any, value: any) {
    return new Promise<void>((resolve) => {
      const obj = { [key]: value };
      chrome.storage.local.set(obj, () => resolve());
    });
  },
  async removeItem(key: any) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove([key], () => resolve());
    });
  }
};