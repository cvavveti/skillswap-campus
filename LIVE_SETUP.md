# SkillSwap live setup

1. Open `supabase-live-migration.sql` in the Supabase SQL Editor and run it once.
2. In Vercel, open the `skillswap-campus-skillswap` project.
3. Go to Settings → Environment Variables.
4. Add these variables for Production, Preview, and Development:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key
5. Redeploy the frontend.

Never put the Supabase secret/service-role key in the frontend or Vercel environment variables prefixed with `VITE_`.

The frontend loads the Supabase browser SDK from jsDelivr, so no new npm package is required.
