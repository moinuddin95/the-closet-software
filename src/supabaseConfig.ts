import { createClient, SupportedStorage } from "@supabase/supabase-js";
import { chromeStorageAdapter } from "./chromeStorageAdaptor";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: chromeStorageAdapter as SupportedStorage,
  },
});
