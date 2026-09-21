# Show History (and any future category) on the home page

## Root cause

The 52 History questions (subcategory "Ancient Civilizations") are in the database and playable. The home page never shows them because its category cards are a hardcoded list in `src/routes/index.tsx` containing only "Capitals" and "Geography". Every newly imported category is invisible until code is edited.

## What will change

### 1. Home page renders categories from the live catalogue
In `src/routes/index.tsx`, replace the hardcoded `categories` array with the groups returned by `getCategoryCatalog` (the same data that already powers the availability counters). Each category in the database automatically gets a card with its name and unseen count. Importing a new category will show it on the home page with no code change.

- Order: "Capitals" first, then "Geography", then remaining categories by unseen count descending, ties by name. This keeps the current look while placing new categories sensibly.
- Notes and icons: keep a small lookup of the existing two categories' notes and icons; a category without a known entry gets a generic icon (BookOpen) and no descriptive note. This avoids inventing copy the user did not approve, and notes can be added on request.
- Card linking, disabled state at zero availability, and preload behaviour stay identical.

### 2. Vetaal's Selection stays as agreed
The mixed set still draws only from Geography plus "Countries of the world" capitals. History questions will not appear in the random mix unless the user asks to include them.

### 3. Nothing else changes
Gameplay, subcategory screens, importer, progress memory, privacy locks: untouched.

## Verification

- Typecheck passes.
- Playwright: home page shows a History card with "52 available"; clicking through to History lists "Ancient Civilizations"; a set starts and an answer reveals correctly; no console errors.
