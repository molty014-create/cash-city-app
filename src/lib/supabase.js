import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
const isValidUrl = (url) => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn('Supabase credentials not configured. Some features will be disabled.')
  }
}

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase

// Export the URL for edge function calls
export const getSupabaseUrl = () => supabaseUrl || ''
