# Replacing the question bank with your new master file

Your file holds 672 questions across 15 subject groups. The site currently holds 207. This plan replaces the whole question bank with your version.

## What changes

- Every existing question is removed and replaced by the 672 questions in your file.
- New subject groups appear under Capitals, including Russia, the United States, Japan, India, Indonesia, Nigeria, China, Mexico, Brazil, Italy, France, Germany and the United Kingdom, alongside the existing Countries of the world group and the Geography group.
- The stored copy of the question file kept inside the project is refreshed to match, so the two never drift apart.

## One consequence worth knowing

Answered-question memory is tied to the questions themselves. Because every question is being replaced, the record of what has already been answered is cleared as well. Anyone playing will start with a fresh slate. Nothing else about play, wording, privacy or the anonymous session changes.

## Checks before and after

- Confirm the file has no repeated question identifiers and no malformed rows before anything is written.
- After loading, confirm the count is 672 and that the group counts match your file exactly.
- Open the home page and one of the new groups to confirm questions appear and answers reveal correctly.

## Technical notes

- The upload is semicolon separated with columns `id;question_id;category;question;option_a..d;correct_answer;difficulty;detail;created_at;updated_at;subcategory`. The `id`, `created_at` and `updated_at` columns are ignored; identity and timestamps are regenerated.
- Load order: delete all `question_progress` rows (the foreign key to `questions` requires it), delete all `questions` rows, then insert the 672 parsed rows through the Supabase data tools with parameterised values, never string-concatenated SQL.
- Empty `difficulty` values are stored as null; all other fields are required and non-empty.
- Regenerate `supabase/seed/questions.csv` from the loaded rows using the existing quoted-CSV convention so `scripts/build-question-seed.mjs` still parses it.
- No schema change and no application code change are needed; the category and subcategory flow already reads whatever the database holds.
