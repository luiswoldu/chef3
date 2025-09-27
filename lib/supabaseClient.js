// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxueztdlrxoystjehjay.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDk5MTYsImV4cCI6MjA3MjEyNTkxNn0.5XEG1f0_8vcwkEWvqSBTWcJmMlW_nUxWkC5eNhSzouo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('[_lib/db.js] Supabase client created:', supabase); // ADD THIS LINE

export const db = supabase;