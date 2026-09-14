REVOKE SELECT ON public.questions FROM anon;
REVOKE SELECT ON public.questions FROM authenticated;

GRANT SELECT (id, question_id, category, subcategory, question, option_a, option_b, option_c, option_d, difficulty, created_at, updated_at) ON public.questions TO anon;
GRANT SELECT (id, question_id, category, subcategory, question, option_a, option_b, option_c, option_d, difficulty, created_at, updated_at) ON public.questions TO authenticated;