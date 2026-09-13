import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const categorySchema = z.enum(["Capitals", "Geography"]);
const answerSchema = z.enum(["A", "B", "C", "D"]);

export type QuizQuestion = {
  questionId: string;
  category: string;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
};

export type AnswerReveal = {
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
  correctOption: string;
  detail: string;
};

export const getAvailableCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: questions, error: questionsError }, { data: progress, error: progressError }] =
      await Promise.all([
        supabaseAdmin.from("questions").select("question_id, category"),
        supabaseAdmin
          .from("question_progress")
          .select("question_id")
          .eq("user_id", context.userId)
          .eq("state", "seen_answered"),
      ]);

    if (questionsError || progressError) throw questionsError ?? progressError;
    const spent = new Set((progress ?? []).map((row) => row.question_id));
    return ["Capitals", "Geography"].map((category) => ({
      category,
      availableCount: (questions ?? []).filter(
        (question) => question.category === category && !spent.has(question.question_id),
      ).length,
    }));
  });

export const startQuestionSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ category: categorySchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: spentRows, error: spentError } = await supabaseAdmin
      .from("question_progress")
      .select("question_id")
      .eq("user_id", context.userId)
      .eq("state", "seen_answered");
    if (spentError) throw spentError;

    const spent = (spentRows ?? []).map((row) => row.question_id);
    let query = supabaseAdmin
      .from("questions")
      .select("question_id, category, question, option_a, option_b, option_c, option_d")
      .eq("category", data.category);
    if (spent.length > 0) query = query.not("question_id", "in", `(${spent.join(",")})`);
    const { data: available, error } = await query;
    if (error) throw error;

    const selected = [...(available ?? [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    if (selected.length > 0) {
      const { error: markError } = await supabaseAdmin.from("question_progress").upsert(
        selected.map((question) => ({
          user_id: context.userId,
          question_id: question.question_id,
          state: "shown_unanswered" as const,
        })),
        { onConflict: "user_id,question_id" },
      );
      if (markError) throw markError;
    }

    return selected.map<QuizQuestion>((item) => ({
      questionId: item.question_id,
      category: item.category,
      question: item.question,
      options: { A: item.option_a, B: item.option_b, C: item.option_c, D: item.option_d },
    }));
  });

export const answerQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ questionId: z.string().min(1), selectedAnswer: answerSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: progress, error: progressError } = await supabaseAdmin
      .from("question_progress")
      .select("state")
      .eq("user_id", context.userId)
      .eq("question_id", data.questionId)
      .maybeSingle();
    if (progressError) throw progressError;
    if (!progress || progress.state !== "shown_unanswered") {
      throw new Error("This question is not available in the current set.");
    }

    const { data: question, error } = await supabaseAdmin
      .from("questions")
      .select("correct_answer, option_a, option_b, option_c, option_d, detail")
      .eq("question_id", data.questionId)
      .single();
    if (error) throw error;

    const correctAnswer = answerSchema.parse(question.correct_answer);
    const correctOption = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d,
    }[correctAnswer];

    const { error: updateError } = await supabaseAdmin
      .from("question_progress")
      .update({ state: "seen_answered" })
      .eq("user_id", context.userId)
      .eq("question_id", data.questionId);
    if (updateError) throw updateError;

    return {
      isCorrect: data.selectedAnswer === correctAnswer,
      correctAnswer,
      correctOption,
      detail: question.detail,
    } satisfies AnswerReveal;
  });