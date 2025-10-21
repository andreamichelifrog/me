import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = 'https://hzxyijuarpfbvygrhqqx.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

if (!SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_KEY in environment (import.meta.env.VITE_SUPABASE_KEY)')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)