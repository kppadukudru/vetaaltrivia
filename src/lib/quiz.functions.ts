import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const categorySchema = z.enum(["Capitals", "Geography"]);
const answerSchema = z.enum(["A", "B", "C", "D"]);

export type QuizQuestion = {
  questionId: string;
  category: string;
  subcategory: string;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
};

export type AnswerReveal = {
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
  correctOption: string;
  detail: string;
};

export const getCategoryCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("category_catalog", {
      _user_id: context.userId,
    });
    if (error) throw error;

    const rows = data ?? [];
    return ["Capitals", "Geography"].map((category) => {
      const subcategories = rows
        .filter((row) => row.category === category)
        .map((row) => ({ name: row.subcategory, availableCount: Number(row.available_count) }))
        .sort((left, right) => left.name.localeCompare(right.name));

      return {
        category,
        availableCount: subcategories.reduce((total, item) => total + item.availableCount, 0),
        subcategories,
      };
    });
  });

export const startQuestionSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ category: categorySchema, subcategory: z.string().trim().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: selected, error } = await supabaseAdmin.rpc("pick_question_set", {
      _user_id: context.userId,
      _category: data.category,
      _subcategory: data.subcategory,
      _limit: 10,
    });
    if (error) throw error;

    const rows = selected ?? [];
    if (rows.length > 0) {
      const { error: markError } = await supabaseAdmin.from("question_progress").upsert(
        rows.map((question) => ({
          user_id: context.userId,
          question_id: question.question_id,
          state: "shown_unanswered" as const,
        })),
        { onConflict: "user_id,question_id" },
      );
      if (markError) throw markError;
    }

    return rows.map<QuizQuestion>((item) => ({
      questionId: item.question_id,
      category: item.category,
      subcategory: item.subcategory,
      question: item.question,
      options: { A: item.option_a, B: item.option_b, C: item.option_c, D: item.option_d },
    }));
  });

export const answerQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
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
