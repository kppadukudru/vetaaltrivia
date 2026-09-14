# Why Vetaal feels slow, and how to fix it

## What I measured

I loaded the site and timed every step.

- The page itself arrives quickly: first response in 20 ms, page drawn in about 0.2 s.
- The category list, with its counts, only appears after **2.6 s**.
- Tapping a category shows the first question after a further **3.1 s**.
- The database is not the problem. It is healthy, and the slowest query averages 2.5 ms.

## Root cause: a chain of calls that wait on each other

Nothing is heavy. Everything is sequential. Before a person sees anything useful, the browser must finish one request, then start the next:

```text
page drawn (0.2s)
  -> create the private session   (0.7s)
    -> fetch the category counts  (0.5s)   = categories visible at 2.6s

tap a category
  -> fetch the category counts again (0.5s)
    -> fetch the subcategory counts  (1.1s)
      -> fetch the counts once more  (0.8s)
        -> start the question set    (1.1s) = question visible at 3.1s
```

Three specific problems:

1. **The counts are fetched from scratch every time.** There is no caching, so every screen and every navigation repeats the same work.
2. **The play screen re-fetches the whole catalogue only to check that the chosen subject exists**, before it is allowed to ask for questions. That check can happen where the questions are fetched, saving two round trips.
3. **The whole page waits on the private session.** Nothing is shown until the anonymous session is created, even though the category names never change and could be on screen instantly.

A smaller contributor: each of these requests is individually slow because the server re-verifies the visitor's session with the authentication service on every single call. Fewer calls therefore compound into a large saving.

## The fix

1. **Cache the catalogue.** Load the category and subcategory counts once through the existing query client and reuse them across the home screen, the category screen, and the play screen, refreshing after a set is played.
2. **Remove the redundant checks.** The play screen stops fetching the catalogue; the subject is validated inside the call that starts the set, which already reads the same data. This removes two of the four calls needed to show a question.
3. **Show the page immediately.** Category cards render at once with their names and descriptions; the counts fill in when they arrive, and the private session is started as soon as the app boots rather than being waited on before the first paint.
4. **Ask the database for counts, not for rows.** The counts currently pull every question row and every progress row into the server and count them there. Counting in the database returns far less data.

Nothing about gameplay, wording, privacy, or the no-repeats memory changes. The same screens, the same copy, the same rules.

## Expected result

Categories visible in well under half a second instead of 2.6 s, and the first question in roughly one second instead of 3.1 s.

## Technical notes

- Wrap `getCategoryCatalog` in a shared `queryOptions` and use it from `index.tsx`, `play.$category.index.tsx`, and `play.$category.$subcategory.tsx`; invalidate it after `startQuestionSet` and at the end of a set.
- Move the subcategory validity check into `startQuestionSet`'s handler and drop the `getCategoryCatalog` call from the play route effect.
- Call `ensureAnonymousSession()` once from the root component, and let category cards render before it resolves.
- Rewrite the catalog handler to use grouped `count` queries rather than selecting all `questions` and `question_progress` rows.
- The generated auth middleware calls `supabase.auth.getClaims` per request; it is auto-generated and will be left untouched, so the gain comes from making fewer calls.
