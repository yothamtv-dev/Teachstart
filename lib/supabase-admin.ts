import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '@/lib/supabase-config'

export function getSupabaseAdmin() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
