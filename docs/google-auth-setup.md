# Turning on Google sign-in

Sign-in is built and deployed but switched off: the login page shows "Login coming soon" until **both** of these are
true:

1. **Admin → Settings → Features → Google sign-in** is ticked (on by default), and
2. the Google provider is enabled in Supabase Auth.

The site reads Supabase's public auth settings every few minutes, so once step 2 is done sign-in appears on its own —
no code change or redeploy.

## 1. Create the OAuth client in Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project for the site.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**.
   - App name, support email, and the site's logo.
   - App domain: your production domain; privacy policy `https://<your-domain>/privacy`, terms
     `https://<your-domain>/terms`.
   - Authorised domains: your production domain and `supabase.co`.
   - Scopes: only `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`. Nothing sensitive is needed,
     so Google verification is quick.
   - Publish the app (move it from "Testing" to "In production"); in testing mode only listed test users can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - Authorised JavaScript origins: `https://<your-domain>` (and `http://localhost:3000` for local testing).
   - Authorised redirect URI — this is Supabase's callback, **not** the site's:

     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```

     For this project: `https://zkthekurepxzdjpnucue.supabase.co/auth/v1/callback`

4. Copy the **Client ID** and **Client secret**.

## 2. Enable the provider in Supabase

1. **Supabase dashboard → Authentication → Sign In / Providers → Google**: enable it and paste the client ID and
   secret. Leave "Skip nonce checks" off.
2. **Authentication → URL Configuration**
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback` (add `http://localhost:3000/auth/callback` for local
     development and, if you use them, your preview domains with a wildcard such as
     `https://*-<team>.vercel.app/auth/callback`).
3. **Authentication → Sign In / Providers → Email**: turn **off** "Enable email provider" (or at least "Allow new
   users to sign up"). The site only offers Google, and leaving email sign-up on lets anyone create accounts through
   the API.

## 3. Check it

1. Open `/login` in a private window. Within about ten minutes the "Continue with Google" button replaces the
   "coming soon" message (the auth settings are cached briefly).
2. Sign in. First-time users land on `/onboarding` (name, programme, term, consent), then on the page they came from.
3. In **Admin → Analytics** the sign-in shows up under _Sign-ins_ after the next hourly rollup (or press
   _Recalculate now_).

## How it works

- The browser starts the PKCE flow with `supabase.auth.signInWithOAuth({ provider: 'google' })`
  (`src/components/auth/google-sign-in.tsx`).
- Google returns to Supabase, which redirects to `/auth/callback?code=…`
  (`src/app/auth/callback/route.ts`). That route exchanges the code for a session cookie, makes sure a profile row
  exists, sets a small display cookie (name and avatar for the header) and records `login_success` or
  `signup_first_login`.
- `next` is validated by `safeNextPath`, so the callback can only return to a path on this site.
- Signed-in areas (`/dashboard`, `/admin`, `/onboarding`) are guarded in `src/proxy.ts` with a real 307 to
  `/login?next=…`. Admin pages also check the role on the server and answer 404 to anyone who is not staff.

## Troubleshooting

| Symptom                                       | Fix                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Google shows `redirect_uri_mismatch`          | The Google client must list the **Supabase** callback URL exactly, including `https` |
| Back on `/login?error=callback`               | `https://<your-domain>/auth/callback` is missing from Supabase's Redirect URLs       |
| Only some accounts can sign in                | The consent screen is still in **Testing**; publish it                               |
| Button still says "coming soon"               | Check the feature flag in Settings, then wait for the ten-minute settings cache      |
| Signed in, but the header still says "Log in" | The header reads a small display cookie set at sign-in; sign out and sign in again   |
