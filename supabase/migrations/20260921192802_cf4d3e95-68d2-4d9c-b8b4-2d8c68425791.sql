CREATE OR REPLACE FUNCTION public.pick_mixed_question_set(_user_id uuid, _limit integer)
RETURNS TABLE(question_id text, category text, subcategory text, question text, option_a text, option_b text, option_c text, option_d text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT q.*
    FROM public.questions q
    WHERE NOT (q.category = 'Capitals' AND q.subcategory <> 'Countries of the world')
      AND NOT EXISTS (
        SELECT 1 FROM public.question_progress p
        WHERE p.user_id = _user_id
          AND p.question_id = q.question_id
          AND p.state = 'seen_answered'
      )
  ),
  ranked AS (
    SELECT e.*, row_number() OVER (PARTITION BY e.category, e.subcategory ORDER BY random()) AS rn
    FROM eligible e
  ),
  firsts AS (
    SELECT * FROM ranked WHERE rn = 1 ORDER BY random() LIMIT _limit
  ),
  fillers AS (
    SELECT * FROM ranked
    WHERE rn > 1 AND question_id NOT IN (SELECT f.question_id FROM firsts f)
    ORDER BY random()
    LIMIT GREATEST(_limit - (SELECT count(*) FROM firsts), 0)
  ),
  chosen AS (
    SELECT * FROM firsts
    UNION ALL
    SELECT * FROM fillers
  )
  SELECT c.question_id, c.category, c.subcategory, c.question, c.option_a, c.option_b, c.option_c, c.option_d
  FROM chosen c
  ORDER BY random();
$$;

REVOKE ALL ON FUNCTION public.pick_mixed_question_set(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pick_mixed_question_set(uuid, integer) TO service_role;