REVOKE ALL ON FUNCTION public.available_question_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_question_set(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.answer_question(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.available_question_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_question_set(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.answer_question(text, text) TO authenticated;
CREATE POLICY "Questions are available only through quiz functions" ON public.questions FOR SELECT TO authenticated USING (false);