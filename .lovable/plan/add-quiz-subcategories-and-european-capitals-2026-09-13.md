# Add quiz subcategories and European capitals

## What will change

- Add a required `subcategory` field to every question. Existing Capitals rows will become `Countries of the world`; existing Geography rows will become `Physical geography`.
- Expand `Countries of the world` with the supplied European capital questions. Replace the two superseded France and Switzerland rows while preserving every other existing question.
- Keep the home page focused on Capitals and Geography. Selecting a category will open its only subcategory immediately. A subcategory choice page will appear automatically once a category contains more than one subcategory.
- Draw each set only from the selected subcategory. Availability counts, short-set wording, no-repeat progress, empty states, and fresh-set actions will all use that subcategory.

## Data order and safeguards

1. Apply a schema migration that adds the column, backfills every row, verifies no blank values remain, and makes the column required.
2. Apply a separate content migration that deletes `CAP-001` and `CAP-008`, then inserts every supplied `CAP-W-*` row.
3. Update the checked-in CSV and its parser contract to include `subcategory`, so the source data matches the live schema.
4. Preserve the existing access rules and progress model. Deleting the two superseded identifiers will remove only their linked progress through the existing relationship.

## Selection flow

```text
Home category
  ├─ one subcategory  → quiz for that subcategory
  └─ several          → subcategory choices → quiz for the chosen subcategory
```

- Keep `/play/$category` as the category decision page.
- Add `/play/$category/$subcategory` as the actual quiz page.
- Return a category catalog with subcategory names and unseen counts from the server.
- Validate both route values before selecting questions.

## Verification

- Confirm every database row has a non-empty subcategory, both superseded identifiers are absent, every supplied European identifier is present once, and untouched sample rows remain.
- Run database security checks after each migration.
- Test the one-subcategory skip, a full set, a short set, leaving before answering, no answered repeats, fresh-set behavior, and invalid paths at desktop and phone widths.
