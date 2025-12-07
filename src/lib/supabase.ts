import { type SupabaseClient, createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybmcuqkllbmqmwtpsgbj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibWN1cWtsbGJtcW13dHBzZ2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTM1ODgsImV4cCI6MjA4MDI4OTU4OH0.wC0LLMjqlq0OT3nnc8riqxNJYvE8_9yrsEqedJbhZTs';

// Lazy-load Supabase client to avoid calling SecureStore before native modules are ready
let supabaseInstance: SupabaseClient | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    // Lazy-import SecureStore only when needed
    const SecureStore = require('expo-secure-store');

    // Custom storage using Expo SecureStore
    const ExpoSecureStoreAdapter = {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
