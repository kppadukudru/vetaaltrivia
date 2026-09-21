REVOKE SELECT ON public.questions FROM anon, authenticated;
DROP POLICY IF EXISTS "Everyone can read questions" ON public.questions;