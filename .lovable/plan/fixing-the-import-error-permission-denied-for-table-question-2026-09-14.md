# Fixing the import error "permission denied for table questions"

## What is happening

The import is being blocked by the database, not by your file.

Earlier, to keep the correct answers and the explanation notes private, the questions table was locked down so ordinary signed-in accounts can only read the display fields. That lock also stops the import from writing whole rows, including the answer and the note, so the upload fails with a permission error even though you are signed in as the administrator.

Confirmed by reading the current permissions: signed-in accounts have read access on the display columns only, and the answer and note columns are not readable by them at all.

## The fix

Keep the privacy lock exactly as it is, and let the import run with trusted server permissions instead.

- The import still verifies first that the caller is a real administrator, through the same signed-in check and the same administrator record as today. That check remains the security boundary.
- Once verified, the reading of which identifiers already exist, the writing of the questions, and the clearing of the answered memory for rewritten questions all run through the trusted server connection, which is already used today for clearing answered memory.
- Nothing changes for players: correct answers and explanation notes stay unreadable from the browser.
- Nothing changes on the import screen: same file format, same two modes, same summary of added, rewritten, skipped and rejected.

## Technical notes

- In `src/lib/admin.functions.ts`, inside `importQuestions`, after `requireAdministrator(context)` succeeds, load `supabaseAdmin` with `await import("@/integrations/supabase/client.server")` and use it for the existing-id pre-read, both upsert paths (`ignoreDuplicates: true` for add, `false` for rewrite) and the `question_progress` delete.
- `context.supabase` is still used for the administrator verification, so the role check is never made with a privilege-bypassing client.
- No migration, no grant change, no schema change.
