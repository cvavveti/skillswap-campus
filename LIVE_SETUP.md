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

## Direct login (no confirmation email)

For SkillSwap's direct email/password signup flow, disable Supabase email confirmation:

1. Supabase Dashboard → Authentication → Sign In / Providers.
2. Open the Email provider settings.
3. Turn **Confirm email** OFF.
4. Save.

With Confirm email disabled, Supabase returns a session immediately after signup, so SkillSwap can send the new user straight to the dashboard. The app no longer tells users to wait for a confirmation email.
