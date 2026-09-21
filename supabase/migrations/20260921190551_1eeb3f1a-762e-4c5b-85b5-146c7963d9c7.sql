create or replace function public.pick_mixed_question_set(
  _user_id uuid,
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
  where (
      q.category = 'Geography'
      or (q.category = 'Capitals' and q.subcategory = 'Countries of the world')
    )
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

revoke all on function public.pick_mixed_question_set(uuid, int) from public, anon, authenticated;
grant execute on function public.pick_mixed_question_set(uuid, int) to service_role;