# Batch updates through the import screen

Today an upload only adds new questions. Any identifier already in the bank is skipped, so corrections cannot be applied in bulk. This adds a second way to upload: rewrite existing questions when the identifier matches.

## What changes on the import screen

Two clear choices before the file is sent:

- Add new questions only. The present behaviour, unchanged and still the default.
- Add new questions and rewrite matching ones. Rows whose identifier already exists replace the stored question, its options, its answer, its difficulty and its note.

Everything else stays as it is: only CSV files, the same header in the same order, the 5 MB and 5000 row limits, the same row by row checks, and rows that fail those checks are never written.

Within a single file an identifier may still appear only once. The first row wins, the later ones are reported rather than written twice.

## The summary after an upload

Three counts instead of two, plus the existing rejected list:

- Added: identifiers that were not in the bank before.
- Rewritten: identifiers that were already there and have been replaced.
- Rejected: rows that failed a check, each with its row number and reason.

In add only mode the middle count reads "Skipped as duplicates", exactly as now, with the same list of identifiers.

## Answered memory

When a question is rewritten, the record that a player already answered it is cleared for that question. The corrected version can then appear once more for everyone. Questions that were merely added, or skipped, leave every player's memory untouched.

## Technical notes

- `importQuestions` in `src/lib/admin.functions.ts` takes a `mode` of `"add"` or `"rewrite"`. In add mode the existing conflict-ignoring upsert stays. In rewrite mode the handler first reads which of the candidate identifiers already exist, then upserts on `question_id` with `ignoreDuplicates: false`, so existing rows are replaced and new ones inserted. The pre-read gives the exact added and rewritten counts.
- Writes keep going through the Supabase client with parameterised values, chunked at 500 rows, so no SQL is assembled from file text.
- After a successful rewrite chunk, delete the `question_progress` rows whose `question_id` is in the rewritten set. This runs through the same client with a parameterised `in` filter.
- Admin authorisation is unchanged: `requireAdministrator` plus the admin-only write policies on `questions` remain the real lock. The progress delete needs a service-role path, since the current policies deny deletes on `question_progress`; the handler performs it with the admin client after the caller has been verified as an administrator.
- `ImportResult` gains a `rewritten` count and a `rewrittenIds` list; `src/routes/admin.import.tsx` renders the mode choice and the extra count.
- Nothing in the player experience, the categories, the existing questions or the anonymous session flow is touched.
