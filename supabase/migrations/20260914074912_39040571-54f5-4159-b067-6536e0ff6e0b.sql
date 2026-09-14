create or replace function public.category_catalog(_user_id uuid)
returns table(category text, subcategory text, available_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.category,
    q.subcategory,
    count(*) filter (where p.question_id is null)::bigint as available_count
  from public.questions q
  left join public.question_progress p
    on p.user_id = _user_id
   and p.question_id = q.question_id
   and p.state = 'seen_answered'
  group by q.category, q.subcategory
$$;

revoke all on function public.category_catalog(uuid) from public, anon, authenticated;
grant execute on function public.category_catalog(uuid) to service_role;

create or replace function public.pick_question_set(
  _user_id uuid,
  _category text,
  _subcategory text,
  _limit int
)
returns table(
  question_id text,
  category text,
  subcategory text,
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text
)
language sql
volatile
security definer
set search_path = public
as $$
  select
    q.question_id,
    q.category,
    q.subcategory,
    q.question,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d
  from public.questions q
  where q.category = _category
    and q.subcategory = _subcategory
    and not exists (
      select 1
      from public.question_progress p
      where p.user_id = _user_id
        and p.question_id = q.question_id
        and p.state = 'seen_answered'
    )
  order by random()
  limit _limit
$$;

revoke all on function public.pick_question_set(uuid, text, text, int) from public, anon, authenticated;
grant execute on function public.pick_question_set(uuid, text, text, int) to service_role;