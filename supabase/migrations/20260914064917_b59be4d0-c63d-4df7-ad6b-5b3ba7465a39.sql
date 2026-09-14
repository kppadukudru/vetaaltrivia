CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "Users can read their own roles" ON public.user_roles;
DROP POLICY "Admins can read all roles" ON public.user_roles;
DROP POLICY "Admins can add questions" ON public.questions;
DROP POLICY "Admins can edit questions" ON public.questions;
DROP POLICY "Admins can remove questions" ON public.questions;

CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND user_id = auth.uid()
);

CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND private.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can add questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND private.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can edit questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND private.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can remove questions"
ON public.questions
FOR DELETE
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND private.has_role(auth.uid(), 'admin')
);

DROP FUNCTION public.has_role(uuid, public.app_role);