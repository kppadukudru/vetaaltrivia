# Vetaal play-alone quiz

## What will be built

- A calm home page with the Vetaal identity, the two seeded categories, and clear About and Privacy links.
- Anonymous entry with no login screen. A private identifier will be created automatically on first visit so completed questions stay completed.
- An untimed, forward-only quiz flow that selects up to 10 available questions from one category.
- Immediate answer feedback with the correct answer and learning note, followed by a single next-question action.
- A round summary with correct and missed counts for that round only, plus every question, correct answer, and learning note.
- Separate About and Privacy Policy pages using the supplied copy exactly.

## Data and privacy

- Create a `questions` table and load all 29 supplied CSV rows through a standards-based CSV parser during development, then store the parsed rows in the database migration.
- Create a private `question_progress` table keyed to the anonymous user and question, with only `seen_answered` and `shown_unanswered` stored. Missing rows represent `unseen`.
- Apply strict access rules. Question content is readable by signed-in anonymous visitors. Each person can only view or change their own progress.
- Enable anonymous sessions. No email, social login, advertising, tracking, or personal profile data will be added.
- Use a database function to reserve a random set atomically, preventing answered questions and duplicates from entering a set.

## Experience details

- Visual direction: moonlit ink, parchment-like light surfaces, muted moss accents, a serif reading voice, and restrained folklore-inspired line details.
- The category start action will state the shorter available count before the set begins when fewer than 10 remain.
- Leaving an unanswered question will keep it available. Answered questions become permanently spent for that anonymous identifier.
- Wrong answers will use gentle, neutral feedback rather than aggressive red or scolding language.
- Empty-category, loading, session-start failure, and exhausted-category states will be clear and recoverable.
- All interface copy will avoid em dashes, slang, generic filler, timers, streaks, and score pressure.

## Technical implementation

- Add shared site navigation and mobile-safe layout in the root route.
- Add dedicated routes for `/`, `/play/$category`, `/about`, and `/privacy`, each with unique page metadata.
- Use the generated Lovable Cloud client for anonymous session creation and database reads and writes.
- Keep round answers and the round score only in browser memory. Persist only question progress.
- Extend the existing button system with Vetaal-specific semantic variants and define all colors, typography, shadows, and motion in the global design system.
- Verify the database seed count and access rules, then test the complete flow at desktop and phone widths, including leaving before answering and exhausting a category.
