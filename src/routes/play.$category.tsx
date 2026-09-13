import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ensureAnonymousSession } from "@/lib/anonymous-session";
import { getCategoryCatalog } from "@/lib/quiz.functions";

type Subcategory = { name: string; availableCount: number };

export const Route = createFileRoute("/play/$category")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.category)} | Vetaal` },
      { name: "description", content: `Choose a ${decodeURIComponent(params.category)} subject for a calm, untimed quiz.` },
      { property: "og:title", content: `${decodeURIComponent(params.category)} | Vetaal` },
      { property: "og:description", content: "Choose a subject and learn something true with every question." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category: encodedCategory } = Route.useParams();
  const category = decodeURIComponent(encodedCategory);
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensureAnonymousSession();
        const catalog = await getCategoryCatalog();
        if (!active) return;
        const match = catalog.find((item) => item.category === category);
        if (!match || match.subcategories.length === 0) {
          setStatus("error");
          return;
        }
        if (match.subcategories.length === 1) {
          await navigate({
            to: "/play/$category/$subcategory",
            params: { category, subcategory: match.subcategories[0].name },
            replace: true,
          });
          return;
        }
        setSubcategories(match.subcategories);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    }
    load();
    return () => { active = false; };
  }, [category, navigate]);

  if (status === "loading") return <CategoryState title="Finding your subjects" text="Your choices are taking shape." />;
  if (status === "error") return <CategoryState title="The trail went quiet" text="This category could not be opened. Please return home and try once more." />;

  return (
    <main className="page-shell py-12 sm:py-18">
      <section className="mx-auto max-w-3xl">
        <p className="eyebrow">{category}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Choose a subject</h1>
        <div className="mt-9 grid gap-4">
          {subcategories.map((subcategory) => {
            const disabled = subcategory.availableCount === 0;
            return (
              <article className="category-card" key={subcategory.name}>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl">{subcategory.name}</h2>
                  <p className="mt-4 font-mono text-xs uppercase text-muted-foreground">{subcategory.availableCount} available</p>
                </div>
                <Button asChild={!disabled} variant="ghost" size="icon" disabled={disabled} aria-label={`Start ${subcategory.name}`}>
                  {disabled ? <ArrowRight /> : <Link to="/play/$category/$subcategory" params={{ category, subcategory: subcategory.name }}><ArrowRight /></Link>}
                </Button>
              </article>
            );
          })}
        </div>
        <Button asChild variant="ghost" className="mt-7"><Link to="/"><ArrowLeft /> Return home</Link></Button>
      </section>
    </main>
  );
}

function CategoryState({ title, text }: { title: string; text: string }) {
  return <main className="page-shell flex min-h-[65vh] items-center"><div className="mx-auto max-w-xl text-center"><p className="eyebrow">Vetaal</p><h1 className="mt-3 font-display text-4xl">{title}</h1><p className="mt-4 text-muted-foreground">{text}</p><Button asChild className="mt-7" size="lg"><Link to="/">Return home</Link></Button></div></main>;
}