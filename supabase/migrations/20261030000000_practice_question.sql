-- Practice question: one question per game can be marked as practice. It is
-- always played first, so guests can learn how the game works, and it never
-- counts toward the score.

alter table public.questions add column is_practice boolean not null default false;
create unique index questions_one_practice on public.questions (game_id) where is_practice;

alter table public.rounds add column is_practice boolean not null default false;

-- Same as before, plus the practice flag. p_rounds is a JSON array of
-- {question_id, text, options[], photo_path, is_practice}.
create or replace function public.start_game(
  p_game_id uuid, p_expected_version bigint, p_rounds jsonb)
returns text
language plpgsql
set search_path = public
as $$
declare
  g public.games%rowtype;
begin
  select * into g from public.games where id = p_game_id for update;
  if not found then return 'game_not_found'; end if;
  if g.version <> p_expected_version then return 'conflict'; end if;
  if g.state <> 'LOBBY' then return 'invalid_transition'; end if;
  if jsonb_array_length(p_rounds) = 0 then return 'no_questions'; end if;

  delete from public.rounds where game_id = p_game_id;

  insert into public.rounds (game_id, round_index, question_id, text, options, photo_path, is_practice)
  select p_game_id,
         (e.ord - 1)::int,
         nullif(e.val ->> 'question_id', '')::uuid,
         e.val ->> 'text',
         array(select jsonb_array_elements_text(e.val -> 'options')),
         nullif(e.val ->> 'photo_path', ''),
         coalesce((e.val ->> 'is_practice')::boolean, false)
    from jsonb_array_elements(p_rounds) with ordinality as e(val, ord);

  update public.games
     set state = 'INTRO', current_index = 0, state_changed_at = now(), version = version + 1
   where id = p_game_id;

  return 'ok';
end;
$$;

revoke execute on function public.start_game(uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.start_game(uuid, bigint, jsonb) to service_role;
