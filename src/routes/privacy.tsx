import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Vetaal" },
      { name: "description", content: "How Vetaal remembers quiz progress without collecting personal details or using trackers." },
      { property: "og:title", content: "Privacy Policy | Vetaal" },
      { property: "og:description", content: "Vetaal remembers answered questions with an anonymous identifier and never uses advertising trackers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="page-shell">
      <article className="prose-page">
        <p className="eyebrow">Plainly stated</p>
        <h1>Privacy Policy</h1>
        <div className="ornament" aria-hidden="true"><span /></div>
        <p>Vetaal is built to respect you. When you first open it, the app creates an anonymous identifier so that your progress can be remembered from one visit to the next. That identifier is not tied to your name, your email address, or any other personal detail, because we never ask for any. The only thing Vetaal records about you is which questions you have already seen and answered, so that you are never shown the same question twice. Vetaal shows no advertising and sets no trackers to follow you across other websites or applications. We do not sell or share your information, because we do not gather the kind of information that could be sold. Should any of this ever change, this page will change with it, and the change will be stated plainly.</p>
      </article>
    </main>
  );
}