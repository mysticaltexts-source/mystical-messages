import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

// Helper: call a Supabase Edge Function with the current user's auth token
export async function callFunction(name, body = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Function call failed')
  return data
}
