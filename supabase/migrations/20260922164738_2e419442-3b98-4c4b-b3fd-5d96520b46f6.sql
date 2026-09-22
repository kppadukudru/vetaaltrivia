ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS random_rank double precision NOT NULL DEFAULT random();

UPDATE public.questions SET random_rank = random() WHERE random_rank IS NULL;

CREATE INDEX IF NOT EXISTS questions_random_rank_idx
  ON public.questions (random_rank);

CREATE INDEX IF NOT EXISTS questions_cat_subcat_random_rank_idx
  ON public.questions (category, subcategory, random_rank);

CREATE OR REPLACE FUNCTION public.pick_question_set(_user_id uuid, _category text, _subcategory text, _limit integer)
 RETURNS TABLE(question_id text, category text, subcategory text, question text, option_a text, option_b text, option_c text, option_d text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH anchor AS (SELECT random() AS r),
  forward AS (
    SELECT q.question_id, q.category, q.subcategory, q.question,
           q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
    FROM public.questions q, anchor a
    WHERE q.category = _category
      AND q.subcategory = _subcategory
      AND q.random_rank >= a.r
      AND NOT EXISTS (
        SELECT 1 FROM public.question_progress p
        WHERE p.user_id = _user_id
          AND p.question_id = q.question_id
          AND p.state = 'seen_answered'
      )
    ORDER BY q.random_rank
    LIMIT _limit
  ),
  wrapped AS (
    SELECT q.question_id, q.category, q.subcategory, q.question,
           q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
    FROM public.questions q, anchor a
    WHERE q.category = _category
      AND q.subcategory = _subcategory
      AND q.random_rank < a.r
      AND NOT EXISTS (
        SELECT 1 FROM public.question_progress p
        WHERE p.user_id = _user_id
          AND p.question_id = q.question_id
          AND p.state = 'seen_answered'
      )
    ORDER BY q.random_rank
    LIMIT GREATEST(_limit - (SELECT count(*) FROM forward), 0)
  ),
  chosen AS (
    SELECT * FROM forward
    UNION ALL
    SELECT * FROM wrapped
  )
  SELECT c.question_id, c.category, c.subcategory, c.question,
         c.option_a, c.option_b, c.option_c, c.option_d
  FROM chosen c
  ORDER BY random();
$function$;

CREATE OR REPLACE FUNCTION public.pick_mixed_question_set(_user_id uuid, _limit integer)
 RETURNS TABLE(question_id text, category text, subcategory text, question text, option_a text, option_b text, option_c text, option_d text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH anchor AS (SELECT random() AS r),
  subs AS (
    SELECT DISTINCT q.category, q.subcategory
    FROM public.questions q
    WHERE NOT (q.category = 'Capitals' AND q.subcategory <> 'Countries of the world')
  ),
  firsts AS (
    SELECT picked.*
    FROM subs s
    CROSS JOIN LATERAL (
      SELECT p.* FROM (
        (
          SELECT q.question_id, q.category, q.subcategory, q.question,
                 q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
          FROM public.questions q, anchor a
          WHERE q.category = s.category
            AND q.subcategory = s.subcategory
            AND q.random_rank >= a.r
            AND NOT EXISTS (
              SELECT 1 FROM public.question_progress pr
              WHERE pr.user_id = _user_id
                AND pr.question_id = q.question_id
                AND pr.state = 'seen_answered'
            )
          ORDER BY q.random_rank
          LIMIT 1
        )
        UNION ALL
        (
          SELECT q.question_id, q.category, q.subcategory, q.question,
                 q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
          FROM public.questions q, anchor a
          WHERE q.category = s.category
            AND q.subcategory = s.subcategory
            AND q.random_rank < a.r
            AND NOT EXISTS (
              SELECT 1 FROM public.question_progress pr
              WHERE pr.user_id = _user_id
                AND pr.question_id = q.question_id
                AND pr.state = 'seen_answered'
            )
          ORDER BY q.random_rank
          LIMIT 1
        )
      ) p
      LIMIT 1
    ) picked
    ORDER BY random()
    LIMIT _limit
  ),
  forward AS (
    SELECT q.question_id, q.category, q.subcategory, q.question,
           q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
    FROM public.questions q, anchor a
    WHERE NOT (q.category = 'Capitals' AND q.subcategory <> 'Countries of the world')
      AND q.random_rank >= a.r
      AND q.question_id NOT IN (SELECT f.question_id FROM firsts f)
      AND NOT EXISTS (
        SELECT 1 FROM public.question_progress pr
        WHERE pr.user_id = _user_id
          AND pr.question_id = q.question_id
          AND pr.state = 'seen_answered'
      )
    ORDER BY q.random_rank
    LIMIT GREATEST(_limit - (SELECT count(*) FROM firsts), 0)
  ),
  wrapped AS (
    SELECT q.question_id, q.category, q.subcategory, q.question,
           q.option_a, q.option_b, q.option_c, q.option_d, q.random_rank
    FROM public.questions q, anchor a
    WHERE NOT (q.category = 'Capitals' AND q.subcategory <> 'Countries of the world')
      AND q.random_rank < a.r
      AND q.question_id NOT IN (SELECT f.question_id FROM firsts f)
      AND NOT EXISTS (
        SELECT 1 FROM public.question_progress pr
        WHERE pr.user_id = _user_id
          AND pr.question_id = q.question_id
          AND pr.state = 'seen_answered'
      )
    ORDER BY q.random_rank
    LIMIT GREATEST(_limit - (SELECT count(*) FROM firsts) - (SELECT count(*) FROM forward), 0)
  ),
  chosen AS (
    SELECT * FROM firsts
    UNION ALL
    SELECT * FROM forward
    UNION ALL
    SELECT * FROM wrapped
  )
  SELECT c.question_id, c.category, c.subcategory, c.question,
         c.option_a, c.option_b, c.option_c, c.option_d
  FROM chosen c
  ORDER BY random();
$function$;