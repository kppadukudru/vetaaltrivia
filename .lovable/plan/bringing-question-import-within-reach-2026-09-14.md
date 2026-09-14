# Bringing question import within reach

Vetaal already has a working import screen for adding questions from a CSV file, but nothing points to it and no administrator account exists yet, so there is currently no way in. This plan makes the door visible and gives you a safe way to become the administrator once.

## What you will get

1. **An administration page at `/admin`.**
   It shows a sign-in form for the administrator, and once you are signed in it shows a clear "Import questions from a CSV file" button that opens the existing import screen. Your signed-in email and a sign-out button appear there too.

2. **A one-time setup for the very first administrator.**
   Because no administrator exists yet, the page will offer, once only, a short form where you choose your own email address and password. Submitting it creates the administrator account and marks it as administrator. The moment one administrator exists, that form disappears forever and the page only offers sign-in. No password is ever written into the app, and nobody else can claim the role later.

3. **Enabling email and password sign-in** on the backend, which is currently switched off. This is separate from the anonymous sessions players use; nothing about the player experience changes.

4. **A quiet link back and forth** between the administration page and the import screen, so you never need to remember an address. The import screen keeps a link back to `/admin`.

## What stays exactly as it is

Gameplay, categories, existing questions, wording, privacy, and the anonymous player session are untouched. The import screen keeps its current behaviour: only new questions are added, duplicates are skipped and reported, invalid rows are rejected with the row number and reason.

## How you will use it

Open `/admin` on the site, create your administrator account once, then sign in whenever you want to add questions and press the import button. The public part of the site carries no link to this page.

## Technical notes

- Call `supabase--enable_email_auth`; leave signups otherwise unchanged.
- New route `src/routes/admin.index.tsx` rendering three states: first-run setup, sign-in, and the signed-in panel with a `Link` to `/admin/import`.
- New server functions in `src/lib/admin.functions.ts`:
  - `adminExists()` — public, returns only a boolean from a count over `public.user_roles` where role is `admin`, using the service client inside the handler.
  - `claimFirstAdmin({ email, password })` — public but self-closing: re-checks inside the handler that zero admin rows exist, then creates the user with the Auth admin API (email confirmed) and inserts the `admin` row. Returns an error when an administrator already exists. Validates the email shape and a minimum password length.
- Sign-in on the page uses `supabase.auth.signInWithPassword`, matching the existing import screen.
- Authorisation remains enforced by the database: `questions` writes stay admin-only under Row Level Security, and `getAdminAccess` continues to gate the import screen. No schema change is needed.
- Add `head()` metadata for the new route with its own title and description.
