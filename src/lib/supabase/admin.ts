import { createClient as createServerClient } from "@supabase/supabase-js";

// Admin client with the service role key. NEVER use this in the browser.
// Only for trusted server-side operations (e.g. secure winner selection,
// audit logging, RBAC management). This bypasses RLS.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase URL or service role key is missing. Check your environment variables.",
    );
  }

  return createServerClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
