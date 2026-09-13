import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Vetaal" },
      { name: "description", content: "Why Vetaal offers quiet, accurate trivia without advertising or pressure." },
      { property: "og:title", content: "About Vetaal" },
      { property: "og:description", content: "A quiet place to learn something true, one carefully checked question at a time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="page-shell">
      <article className="prose-page">
        <p className="eyebrow">The story behind the questions</p>
        <h1>About Vetaal</h1>
        <div className="ornament" aria-hidden="true"><span /></div>
        <p>Vetaal is a quiet place to learn something true. It asks you one question at a time, offers you a few answers to choose from, and once you have chosen it tells you not only which answer was right but why, along with a little more that is worth knowing. The name comes from the old tales of Vikram and the Betaal, the riddling spirit who ends every story with a question that must be answered. There are no advertisements here, no streaks pressing you to come back, and nothing standing between you and the thing you came to learn. Every question is checked before it is trusted, because the one promise Vetaal makes is that the answer is worth keeping.</p>
      </article>
    </main>
  );
}