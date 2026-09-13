import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Landmark, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

import spirit from "@/assets/vetaal-spirit.png";
import { Button } from "@/components/ui/button";
import { ensureAnonymousSession } from "@/lib/anonymous-session";
import { getAvailableCounts } from "@/lib/quiz.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vetaal | Calm, Accurate Trivia" },
      { name: "description", content: "Learn something true with every calm, untimed trivia question. No advertising and no pressure." },
      { property: "og:title", content: "Vetaal | Calm, Accurate Trivia" },
      { property: "og:description", content: "One careful question at a time, followed by an answer worth keeping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    ensureAnonymousSession()
      .then(() => getAvailableCounts())
      .then((result) => { if (active) setCounts(Object.fromEntries(result.map((item) => [item.category, item.availableCount]))); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const categories = [
    { name: "Capitals", note: "Cities chosen by history, compromise, and sometimes stubbornness.", icon: Landmark },
    { name: "Geography", note: "The deep, high, broad, and unexpected facts of the world.", icon: Globe2 },
  ];

  return (
    <main>
      <section className="home-intro">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_360px] lg:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">A quiet place for curious minds</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-7xl">Vetaal</h1>
            <p className="mt-5 max-w-2xl font-display text-2xl leading-relaxed text-muted-foreground sm:text-3xl">Learn something true with every question.</p>
            <p className="mt-6 max-w-xl leading-7 text-muted-foreground">Choose a subject. Take your time. Once you answer, Vetaal will tell you what is right and why it is worth knowing.</p>
          </div>
          <img src={spirit} alt="A small owl-like spirit resting in a crescent moon" width={1024} height={1024} className="mx-auto w-56 opacity-90 sm:w-64 lg:w-80" />
        </div>
      </section>
      <section className="border-t border-border/70 bg-surface-subtle">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-7 flex items-end justify-between gap-5"><div><p className="eyebrow">Choose a path</p><h2 className="mt-2 font-display text-3xl">Begin a set</h2></div><p className="hidden text-sm text-muted-foreground sm:block">Up to 10 questions</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map(({ name, note, icon: Icon }) => {
              const available = counts[name];
              const disabled = ready && available === 0;
              return (
                <article className="category-card" key={name}>
                  <div className="category-icon"><Icon /></div>
                  <div className="min-w-0"><h3 className="font-display text-2xl">{name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p><p className="mt-5 font-mono text-xs uppercase text-muted-foreground">{ready ? `${available ?? 0} available` : "Checking your progress"}</p></div>
                  <Button asChild={!disabled} variant="ghost" size="icon" disabled={disabled} aria-label={`Start ${name}`}>
                    {disabled ? <ArrowRight /> : <Link to="/play/$category" params={{ category: name }}><ArrowRight /></Link>}
                  </Button>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><LockKeyhole className="size-4 text-primary" /><p>Your private progress is remembered. Nothing personal is requested.</p></div>
        </div>
      </section>
    </main>
  );
}
