// Public fallback mirrors the generated browser client's direct Supabase config.
const PROJECT_SUPABASE_URL = 'https://iethyrkvhonpzzhsieay.supabase.co';
const PROJECT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QMsSgNPwlUmc80UaoNkTXQ_ofG4aYDl';

export function getSupabaseServerConfig(env: Record<string, string | undefined> = process.env) {
  return {
    url: env['SUPABASE_URL'] || PROJECT_SUPABASE_URL,
    publishableKey: env['SUPABASE_PUBLISHABLE_KEY'] || PROJECT_SUPABASE_PUBLISHABLE_KEY,
  };
}
