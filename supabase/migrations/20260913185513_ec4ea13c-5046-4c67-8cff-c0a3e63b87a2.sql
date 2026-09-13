ALTER TABLE public.questions ALTER COLUMN subcategory SET NOT NULL;
ALTER TABLE public.questions ADD CONSTRAINT questions_subcategory_not_blank CHECK (btrim(subcategory) <> '');