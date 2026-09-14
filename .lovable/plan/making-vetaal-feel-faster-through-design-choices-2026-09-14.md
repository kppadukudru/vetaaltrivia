# Making Vetaal feel faster through design choices

The waiting is mostly gone. What remains is weight and perceived speed: how heavy the first screen is, and whether a person ever sees a blank or shifting area.

## 1. The spirit picture is by far the heaviest thing on the site

The home image is a 1.2 MB file, and it is displayed at roughly a quarter of its size. It is the single largest download on the first visit.

- Serve it in a modern, compressed format at the sizes actually used.
- Expected size after this: well under 100 KB, with no visible loss of quality.
- Mark it as the main image of the home page so the browser fetches it early rather than last.

## 2. The three custom fonts delay the first readable text

Three font families are loaded from an outside address before text can settle. Two improvements, neither of which changes the look:

- Show the text immediately in a fallback while the custom fonts arrive, so nothing is invisible during the wait.
- Load only the weights actually used, and only the characters needed for Latin text.

## 3. Prepare the next screen before it is asked for

A person on the home page will almost certainly tap a category next.

- Begin loading a category page when the pointer rests on its card or the card gains focus, so the tap feels instant.
- Once a set is running, the questions are already in hand, so moving between them stays immediate.

## 4. Hold the shape of the page while things load

Two places currently change their own layout as data arrives: the counts on the category cards, and the play screen switching from "loading" to a question.

- Reserve the space for the counts so the cards do not shift when the number appears.
- Give the loading state of the play screen the same height and shape as a question, so the question appears in place rather than pushing the page around.

## 5. Small, quiet wins

- The footer, the About text, and the Privacy text are static and can be delivered as part of the first response rather than waited for.
- The icons are already small; nothing to change there.

## What this will not change

Gameplay, wording, privacy, the no-repeats memory, the colours, the typefaces, and the layout all stay exactly as they are.

## Technical notes

- Add `vite-imagetools` and import `vetaal-spirit.png` as AVIF and WebP variants at 320w/640w, rendered through `<picture>` with `width`/`height` set and `fetchpriority="high"`; add a `preload` link in the home route `head().links`.
- Add `&display=swap` handling and trim the Google Fonts request to the weights in use; add `&text=`-free `subset=latin` where supported.
- Add `preload="intent"` behaviour via TanStack Router `Link preload="intent"` on the home category cards and subcategory cards, with `defaultPreload` left off globally.
- Reserve count height with a fixed-height line and a skeleton placeholder in `index.tsx`; give `CategoryState` and the play loading state a `min-h` matching a rendered question card.
