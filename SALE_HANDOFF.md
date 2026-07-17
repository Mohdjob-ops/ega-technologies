# Sale Handoff Checklist

Use this before handing the project to a buyer.

## Verified Locally

- [x] Open terminal in `/Users/mohdelmi/Desktop/Ega-project/EGA/EGA2026`.
- [x] Run `npm install`.
- [x] Run `npm run build`.
- [ ] Run `npx expo start --web --clear`.
- [x] Confirm the home page opens.
- [ ] Confirm registration can submit.
- [ ] Confirm learner portal can find a student.
- [ ] Confirm admin login works with the final owner admin email.
- [ ] Confirm payment request review works.

## Supabase

- [ ] Transfer or document the Supabase project.
- [ ] Confirm `src/lib/supabase.ts` points to the final Supabase project.
- [ ] Apply every SQL file in `supabase/migrations/` if using a fresh project.
- [ ] In Supabase Auth, create or confirm the buyer's admin user.
- [ ] Reset the buyer admin password in Supabase Auth.
- [ ] In `public.admin_users`, set the buyer admin UID and `active = true`.
- [ ] Remove or deactivate seller-only admin users.

## Payment And Email

- [ ] Transfer Chapa account/API ownership or replace `CHAPA_SECRET_KEY`.
- [ ] Confirm Supabase Edge Function secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CHAPA_SECRET_KEY`
- [ ] Transfer EmailJS account/templates or replace the EmailJS IDs in `src/app/register.tsx`.
- [ ] Send one test admin email and one test student email.

## Deployment

- [ ] Run `npm run build` successfully.
- [ ] Deploy with build command `npm run build`.
- [ ] Use `dist` as the output directory.
- [ ] Confirm routes work after refresh, especially `/admin-dashboard`.
- [x] Confirm deployment rewrite config exists for refreshed app routes.
- [ ] Confirm password reset redirect URLs are allowed in Supabase Auth.

## Final Seller Notes

- Do not sell only the source code without also explaining Supabase, Chapa, and EmailJS ownership.
- The public Supabase anon key is normal in frontend apps. Never share the service role key except through secure account transfer.
- Make a final Git commit after all buyer-specific admin and service details are verified.
