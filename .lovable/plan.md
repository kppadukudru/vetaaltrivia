# Make the importer accept your master file

## What is actually wrong

Your file is fine. The importer is too strict. Checked the upload:

- It separates values with semicolons, not commas.
- It has fourteen columns, not eleven: three extra ones (`id`, `created_at`, `updated_at`).
- The subject group column sits at the very end instead of third.

The importer currently demands exactly eleven columns, comma separated, in one fixed order, so it rejects the whole file before reading a single question. All 672 rows are otherwise well formed.

## What I will change

Make the import screen read a file by its column names rather than by position.

1. Detect the separator automatically, so both comma and semicolon files work.
2. Match columns by their heading name in any order, so the subject group can sit anywhere.
3. Ignore extra columns such as `id`, `created_at` and `updated_at` instead of rejecting the file.
4. Reject only when a genuinely required heading is missing, and name exactly which one.
5. Keep everything else as it is: the five megabyte and five thousand row limits, per row checking, the add-only and rewrite choices, and the summary of what was added, rewritten, skipped and rejected.

A note on size: your file holds 672 rows, which is inside the five thousand row limit.

## After the change

Open the import screen, choose "Add and rewrite matching ones" if you want existing questions corrected in place, and upload this same file unchanged.

## Technical detail

`src/routes/admin.import.tsx`: switch PapaParse to `header: true` with `delimiter: ""` for auto detection, trim header names, build rows from a required-name map, and report missing required headers rather than positional mismatches. `src/lib/admin.functions.ts` needs no change; it already validates and writes by field name.
