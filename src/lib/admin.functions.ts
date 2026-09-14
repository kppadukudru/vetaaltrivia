import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const answerSchema = z.enum(["A", "B", "C", "D"]);

const importRowSchema = z.object({
  rowNumber: z.number().int().min(2),
  question_id: z.string().trim().min(1, "question_id is empty"),
  category: z.string().trim().min(1, "category is empty"),
  subcategory: z.string().trim().min(1, "subcategory is empty"),
  question: z.string().trim().min(1, "question is empty"),
  option_a: z.string().trim().min(1, "option_a is empty"),
  option_b: z.string().trim().min(1, "option_b is empty"),
  option_c: z.string().trim().min(1, "option_c is empty"),
  option_d: z.string().trim().min(1, "option_d is empty"),
  correct_answer: answerSchema,
  difficulty: z.string(),
  detail: z.string().trim().min(1, "detail is empty"),
});

const importPayloadSchema = z.object({
  rows: z.array(z.unknown()).max(5000),
});

export type QuestionImportRow = z.infer<typeof importRowSchema>;

export type ImportRejection = {
  rowNumber: number;
  reasons: string[];
};

export type ImportResult = {
  added: number;
  skipped: number;
  rejected: ImportRejection[];
  duplicateIds: string[];
};

async function requireAdministrator(
  context: {
    supabase: SupabaseClient<Database>;
    userId: string;
    claims: { is_anonymous?: boolean };
  },
) {
  if (context.claims.is_anonymous === true) throw new Error("Administrator access is required.");

  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) throw new Error("Administrator access is required.");
}

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdministrator(context);
    return { allowed: true };
  });

export const importQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => importPayloadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdministrator(context);

    const encodedSize = new TextEncoder().encode(JSON.stringify(data.rows)).byteLength;
    if (encodedSize > 5 * 1024 * 1024) throw new Error("The upload is larger than 5 MB.");

    const rejected: ImportRejection[] = [];
    const validRows: QuestionImportRow[] = [];

    for (const candidate of data.rows) {
      const parsed = importRowSchema.safeParse(candidate);
      if (!parsed.success) {
        const rowNumber =
          typeof candidate === "object" && candidate !== null && "rowNumber" in candidate &&
          typeof candidate.rowNumber === "number"
            ? candidate.rowNumber
            : 0;
        rejected.push({
          rowNumber,
          reasons: [...new Set(parsed.error.issues.map((issue) => issue.message))],
        });
        continue;
      }
      validRows.push(parsed.data);
    }

    const firstById = new Map<string, QuestionImportRow>();
    const fileDuplicateIds: string[] = [];
    let fileDuplicateCount = 0;
    for (const row of validRows) {
      if (firstById.has(row.question_id)) {
        fileDuplicateCount += 1;
        fileDuplicateIds.push(row.question_id);
      } else {
        firstById.set(row.question_id, row);
      }
    }

    const candidates = [...firstById.values()];
    const addedIds = new Set<string>();
    for (let index = 0; index < candidates.length; index += 500) {
      const chunk = candidates.slice(index, index + 500);
      const { data: inserted, error } = await context.supabase
        .from("questions")
        .upsert(
          chunk.map(({ rowNumber: _rowNumber, ...row }) => ({
            ...row,
            difficulty: row.difficulty.trim() || null,
          })),
          { onConflict: "question_id", ignoreDuplicates: true },
        )
        .select("question_id");

      if (error) throw new Error(`The questions could not be imported: ${error.message}`);
      for (const row of inserted ?? []) addedIds.add(row.question_id);
    }

    const databaseDuplicateIds = candidates
      .filter((row) => !addedIds.has(row.question_id))
      .map((row) => row.question_id);
    const duplicateIds = [...new Set([...fileDuplicateIds, ...databaseDuplicateIds])].sort();

    return {
      added: addedIds.size,
      skipped: fileDuplicateCount + databaseDuplicateIds.length,
      rejected,
      duplicateIds,
    } satisfies ImportResult;
  });