DROP POLICY "Questions are available only through quiz functions" ON public.questions;
CREATE POLICY "Trusted server manages questions" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Trusted server manages progress" ON public.question_progress FOR ALL TO service_role USING (true) WITH CHECK (true);