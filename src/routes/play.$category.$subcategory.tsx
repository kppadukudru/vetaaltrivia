import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, House, Layers3, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ensureAnonymousSession } from "@/lib/anonymous-session";
import { catalogQueryKey } from "@/lib/quiz-queries";
import { answerQuestion, startQuestionSet, type AnswerReveal, type QuizQuestion } from "@/lib/quiz.functions";

type Letter = "A" | "B" | "C" | "D";
type RoundItem = { question: QuizQuestion; selected: Letter; reveal: AnswerReveal };

export const Route = createFileRoute("/play/$category/$subcategory")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.subcategory)} Quiz | Vetaal` },
      { name: "description", content: `A calm, untimed ${decodeURIComponent(params.subcategory)} quiz with an explanation after every answer.` },
      { property: "og:title", content: `${decodeURIComponent(params.subcategory)} Quiz | Vetaal` },
      { property: "og:description", content: "Learn something true with every question. No timer, no advertising, and no pressure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { category: encodedCategory, subcategory: encodedSubcategory } = Route.useParams();
  const category = decodeURIComponent(encodedCategory);
  const subcategory = decodeURIComponent(encodedSubcategory);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [reveal, setReveal] = useState<AnswerReveal | null>(null);
  const [round, setRound] = useState<RoundItem[]>([]);
  const [status, setStatus] = useState<"loading" | "playing" | "summary" | "empty" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const validCategory = category === "Capitals" || category === "Geography";
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    async function begin() {
      if (!validCategory) { setStatus("error"); return; }
      try {
        await ensureAnonymousSession();
        const set = await startQuestionSet({ data: { category, subcategory } });
        if (!active) return;
        setQuestions(set);
        setStatus(set.length ? "playing" : "empty");
      } catch { if (active) setStatus("error"); }
    }
    begin();
    return () => { active = false; };
  }, [category, subcategory, validCategory]);

  useEffect(() => () => {
    void queryClient.invalidateQueries({ queryKey: catalogQueryKey });
  }, [queryClient]);

  const question = questions[index];
  const total = questions.length;

  async function restart() {
    setStatus("loading");
    setQuestions([]);
    setIndex(0);
    setSelected(null);
    setReveal(null);
    setRound([]);
    try {
      const set = await startQuestionSet({ data: { category, subcategory } });
      setQuestions(set);
      setStatus(set.length ? "playing" : "empty");
    } catch {
      setStatus("error");
    }
  }

  async function choose(letter: Letter) {
    if (!question || selected || submitting) return;
    setSubmitting(true);
    try {
      const result = await answerQuestion({ data: { questionId: question.questionId, selectedAnswer: letter } });
      setSelected(letter);
      setReveal(result);
      setRound((items) => [...items, { question, selected: letter, reveal: result }]);
    } finally { setSubmitting(false); }
  }

  function next() {
    if (index + 1 >= total) {
      setStatus("summary");
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey });
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setReveal(null);
  }

  if (status === "loading") return <StatePage title="Gathering your questions" text="The next set is taking shape." />;
  if (status === "error") return <StatePage title="The trail went quiet" text="This set could not begin. Please return home and try once more." />;
  if (status === "empty") return <StatePage title={`${subcategory} is complete`} text="You have answered every available question in this subject." />;

  if (status === "summary") {
    const correct = round.filter((item) => item.reveal.isCorrect).length;
    return (
      <main className="page-shell py-12 sm:py-18">
        <section className="mx-auto max-w-3xl">
          <p className="eyebrow">Set complete</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Here is what you found</h1>
          <p className="mt-5 text-lg text-muted-foreground">You answered {correct} correctly and missed {round.length - correct}.</p>
          <div className="mt-10 space-y-5">
            {round.map((item, itemIndex) => (
              <article key={item.question.questionId} className="summary-entry">
                <p className="question-number">Question {itemIndex + 1}</p>
                <h2>{item.question.question}</h2>
                <p className="answer-line"><Check className="size-4" /> {item.reveal.correctAnswer}. {item.reveal.correctOption}</p>
                <p className="mt-3 text-muted-foreground">{item.reveal.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg"><Link to="/"><House /> Home</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/"><Layers3 /> Another category</Link></Button>
            <Button variant="ghost" size="lg" onClick={restart}><RotateCcw /> Fresh {subcategory} set</Button>
          </div>
        </section>
      </main>
    );
  }

  if (!question) return null;
  return (
    <main className="page-shell py-8 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{subcategory}</span><span>Question {index + 1} of {total}</span>
        </div>
        {total < 10 && index === 0 && <p className="set-note">Only {total} {total === 1 ? "question is" : "questions are"} available in this set.</p>}
        <div className="progress-track" aria-label={`Question ${index + 1} of ${total}`}><span style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
        <h1 className="mt-10 font-display text-3xl leading-tight sm:text-5xl">{question.question}</h1>
        <div className="mt-8 grid gap-3" role="group" aria-label="Answer choices">
          {(Object.entries(question.options) as [Letter, string][]).map(([letter, text]) => {
            const isCorrect = reveal?.correctAnswer === letter;
            const isChosenWrong = selected === letter && reveal && !reveal.isCorrect;
            return <Button key={letter} variant={isCorrect ? "answerCorrect" : isChosenWrong ? "answerMissed" : "answer"} size="answer" disabled={Boolean(selected) || submitting} onClick={() => choose(letter)}><span className="answer-letter">{letter}</span><span>{text}</span></Button>;
          })}
        </div>
        {reveal && (
          <div className="reveal-panel" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className={reveal.isCorrect ? "result-icon result-correct" : "result-icon result-gentle"}>{reveal.isCorrect ? <Check /> : <X />}</span>
              <div><p className="font-display text-2xl">{reveal.isCorrect ? "That is right." : "Not this time."}</p><p className="text-muted-foreground">The answer is {reveal.correctAnswer}. {reveal.correctOption}.</p></div>
            </div>
            <p className="mt-6 leading-7">{reveal.detail}</p>
            <Button className="mt-7 w-full sm:w-auto" size="lg" onClick={next}>{index + 1 >= total ? "See what you learned" : "Next question"}<ArrowRight /></Button>
          </div>
        )}
        <div className="mt-8 border-t border-border pt-5"><Button asChild variant="ghost"><Link to="/">Leave this set</Link></Button></div>
      </section>
    </main>
  );
}

function StatePage({ title, text }: { title: string; text: string }) {
  return <main className="page-shell flex min-h-[65vh] items-center"><div className="mx-auto max-w-xl text-center"><p className="eyebrow">Vetaal</p><h1 className="mt-3 font-display text-4xl">{title}</h1><p className="mt-4 text-muted-foreground">{text}</p><Button asChild className="mt-7" size="lg"><Link to="/">Return home</Link></Button></div></main>;
}