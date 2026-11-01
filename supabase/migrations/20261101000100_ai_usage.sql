-- Daily counter of AI quiz-builder messages per user, so one account can't
-- use up the shared (free) Gemini quota. Only the server touches it.
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts one AI message. Returns false (and counts nothing) once the user
-- reached today's limit.
create or replace function public.bump_ai_usage(p_user uuid, p_limit int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  n int;
begin
  insert into public.ai_usage (user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count into n;
  return n is not null;
end;
$$;

revoke execute on function public.bump_ai_usage(uuid, int) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(uuid, int) to service_role;
