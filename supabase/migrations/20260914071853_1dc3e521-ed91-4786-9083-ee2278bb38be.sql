GRANT SELECT, INSERT, UPDATE ON public.question_progress TO authenticated;

CREATE POLICY "Users can read their own progress"
ON public.question_progress FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own progress"
ON public.question_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
ON public.question_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());