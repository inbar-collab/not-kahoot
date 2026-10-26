-- not-kahoot: initial schema
-- ---------------------------------------------------------------------------
-- Security model
--   * Every table has Row Level Security enabled and NO policies for the
--     public roles (anon / authenticated). Browsers therefore cannot read or
--     write game data directly. All reads and writes go through the app's
--     server routes, which use the service-role key and filter what each role
--     (guest / birthday person / TV / admin) is allowed to see.
--   * The only table browsers can read is `game_pulse`: a per-game change
--     counter with no game content. Browsers subscribe to it with Supabase
--     Realtime and re-fetch their (filtered) view from the server whenever it
--     changes.
--   * Game logic that must be atomic (answering, locking the birthday answer,
--     state transitions) lives in SQL functions that only the service role may
--     execute.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables --

create table public.games (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[A-Z0-9]{4,10}$'),
  admin_token         text not null,
  birthday_token      text not null,
  title               text not null default '' check (char_length(title) <= 120),
  birthday_name       text not null default '' check (char_length(birthday_name) <= 60),
  birthday_gender     text not null default 'female' check (birthday_gender in ('female', 'male')),
  birthday_age        int check (birthday_age is null or birthday_age between 0 and 150),
  birthday_date       date,
  birthday_photo_path text,
  num_questions       int check (num_questions is null or num_questions between 1 and 200),
  leaderboard_every   int not null default 5 check (leaderboard_every between 0 and 200),
  sounds_enabled      boolean not null default false,
  allow_late_join     boolean not null default true,
  state               text not null default 'LOBBY' check (state in (
                        'LOBBY', 'INTRO', 'QUESTION_OPEN', 'QUESTION_CLOSED',
                        'WAITING_FOR_BIRTHDAY', 'REVEAL', 'RESULTS', 'LEADERBOARD', 'FINISHED')),
  current_index       int not null default -1,
  state_changed_at    timestamptz not null default now(),
  version             bigint not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  position    int not null default 0,
  text        text not null check (char_length(btrim(text)) between 1 and 300),
  options     text[] not null check (
                array_length(options, 1) between 2 and 4
                and array_position(options, null) is null),
  photo_path  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index questions_game_idx on public.questions (game_id, position);

create table public.library_photos (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  path        text not null,
  created_at  timestamptz not null default now()
);
create index library_photos_game_idx on public.library_photos (game_id);

create table public.players (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.games (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 24),
  name_key      text not null,
  token_hash    text not null,
  avatar_emoji  text check (avatar_emoji is null or char_length(avatar_emoji) <= 16),
  avatar_path   text,
  is_fake       boolean not null default false,
  kicked_at     timestamptz,
  joined_at     timestamptz not null default now()
);
create index players_game_idx on public.players (game_id);
create index players_token_idx on public.players (token_hash);
-- Nicknames are unique among the players who are still in the game.
create unique index players_unique_active_name
  on public.players (game_id, name_key) where kicked_at is null;

-- A round is a question as it is played in this run of the game. Text and
-- options are copied from `questions` when the game starts so that editing a
-- question mid-game can never corrupt answers that were already given.
create table public.rounds (
  id                  uuid primary key default gen_random_uuid(),
  game_id             uuid not null references public.games (id) on delete cascade,
  round_index         int not null check (round_index >= 0),
  question_id         uuid references public.questions (id) on delete set null,
  text                text not null,
  options             text[] not null check (array_length(options, 1) between 2 and 4),
  photo_path          text,
  birthday_choices    int[],
  birthday_locked_at  timestamptz,
  opened_at           timestamptz,
  closed_at           timestamptz,
  revealed_at         timestamptz,
  unique (game_id, round_index)
);

create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  round_id    uuid not null references public.rounds (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  choice      int not null check (choice between 0 and 3),
  created_at  timestamptz not null default now(),
  unique (round_id, player_id)
);
create index answers_game_idx on public.answers (game_id);

-- Change counter that browsers listen to (contains no game content).
create table public.game_pulse (
  game_id     uuid primary key references public.games (id) on delete cascade,
  version     bigint not null default 0,
  kind        text not null default 'state',
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- security --

alter table public.games          enable row level security;
alter table public.questions      enable row level security;
alter table public.library_photos enable row level security;
alter table public.players        enable row level security;
alter table public.rounds         enable row level security;
alter table public.answers        enable row level security;
alter table public.game_pulse     enable row level security;

-- Belt and braces: besides RLS (no policies = no access), remove the table
-- privileges Supabase grants to the public roles by default.
revoke all on table
  public.games, public.questions, public.library_photos,
  public.players, public.rounds, public.answers, public.game_pulse
from anon, authenticated;

grant select on table public.game_pulse to anon, authenticated;
create policy "pulse is readable" on public.game_pulse
  for select to anon, authenticated using (true);

-- ------------------------------------------------------------ realtime --

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
alter publication supabase_realtime add table public.game_pulse;

-- Every change to game data bumps the game's pulse.
create or replace function public.bump_pulse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  k   text;
begin
  if tg_table_name = 'games' then
    gid := new.id;  -- trigger is only attached for insert/update on games
  elsif tg_op = 'DELETE' then
    gid := old.game_id;
  else
    gid := new.game_id;
  end if;

  k := case tg_table_name
         when 'answers' then 'answer'
         when 'players' then 'player'
         when 'questions' then 'content'
         when 'library_photos' then 'content'
         else 'state'
       end;

  insert into public.game_pulse as gp (game_id, version, kind, updated_at)
  select gid, 1, k, now()
  where exists (select 1 from public.games where id = gid)
  on conflict (game_id) do update
    set version = gp.version + 1, kind = excluded.kind, updated_at = now();

  return null;
end;
$$;

create trigger games_pulse after insert or update on public.games
  for each row execute function public.bump_pulse();
create trigger questions_pulse after insert or update or delete on public.questions
  for each row execute function public.bump_pulse();
create trigger library_photos_pulse after insert or update or delete on public.library_photos
  for each row execute function public.bump_pulse();
create trigger players_pulse after insert or update or delete on public.players
  for each row execute function public.bump_pulse();
create trigger rounds_pulse after insert or update or delete on public.rounds
  for each row execute function public.bump_pulse();
create trigger answers_pulse after insert or update or delete on public.answers
  for each row execute function public.bump_pulse();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------ game functions --

-- A guest answers the current question. Takes a share lock on the game row so
-- an answer can never slip in after the host closed voting.
create or replace function public.submit_answer(
  p_game_id uuid, p_player_id uuid, p_round_id uuid, p_choice int)
returns text
language plpgsql
set search_path = public
as $$
declare
  g public.games%rowtype;
  r public.rounds%rowtype;
  p public.players%rowtype;
begin
  select * into g from public.games where id = p_game_id for share;
  if not found then return 'game_not_found'; end if;

  select * into p from public.players where id = p_player_id and game_id = p_game_id;
  if not found then return 'player_not_found'; end if;
  if p.kicked_at is not null then return 'player_kicked'; end if;

  if g.state <> 'QUESTION_OPEN' then return 'voting_closed'; end if;

  select * into r from public.rounds where id = p_round_id and game_id = p_game_id;
  if not found or r.round_index <> g.current_index then return 'not_current_round'; end if;
  if p_choice is null or p_choice < 0 or p_choice >= array_length(r.options, 1) then
    return 'invalid_choice';
  end if;

  insert into public.answers (game_id, round_id, player_id, choice)
  values (p_game_id, p_round_id, p_player_id, p_choice)
  on conflict (round_id, player_id) do nothing;
  if not found then return 'already_answered'; end if;

  return 'ok';
end;
$$;

-- The birthday person locks her answer(s) for the current question.
create or replace function public.birthday_lock(
  p_game_id uuid, p_round_id uuid, p_choices int[])
returns text
language plpgsql
set search_path = public
as $$
declare
  g public.games%rowtype;
  r public.rounds%rowtype;
  n int;
  clean int[];
begin
  select * into g from public.games where id = p_game_id for update;
  if not found then return 'game_not_found'; end if;
  if g.state not in ('QUESTION_OPEN', 'WAITING_FOR_BIRTHDAY') then return 'not_accepting'; end if;

  select * into r from public.rounds where id = p_round_id and game_id = p_game_id;
  if not found or r.round_index <> g.current_index then return 'not_current_round'; end if;
  if r.birthday_locked_at is not null then return 'already_locked'; end if;

  n := array_length(r.options, 1);
  select array_agg(distinct c order by c) into clean from unnest(p_choices) as c;
  if clean is null or array_length(clean, 1) = 0 then return 'invalid_choice'; end if;
  if exists (select 1 from unnest(clean) c where c is null or c < 0 or c >= n) then
    return 'invalid_choice';
  end if;

  update public.rounds
     set birthday_choices = clean, birthday_locked_at = now()
   where id = r.id;

  if g.state = 'WAITING_FOR_BIRTHDAY' then
    update public.games
       set state = 'QUESTION_CLOSED', state_changed_at = now(), version = version + 1
     where id = g.id;
  else
    update public.games set version = version + 1 where id = g.id;
  end if;

  return 'ok';
end;
$$;

-- Applies a state transition that the server-side state machine planned.
-- Compare-and-swap on `version` guarantees only one of two simultaneous host
-- clicks wins; the round side effect is applied in the same transaction.
create or replace function public.apply_transition(
  p_game_id uuid,
  p_expected_version bigint,
  p_state text,
  p_index int,
  p_round_index int,      -- round to touch, or null
  p_round_effect text     -- 'open' | 'close' | 'reveal' | null
)
returns text
language plpgsql
set search_path = public
as $$
declare
  g public.games%rowtype;
  r public.rounds%rowtype;
begin
  select * into g from public.games where id = p_game_id for update;
  if not found then return 'game_not_found'; end if;
  if g.version <> p_expected_version then return 'conflict'; end if;

  if p_round_index is not null and p_round_effect is not null then
    select * into r from public.rounds where game_id = p_game_id and round_index = p_round_index;
    if not found then return 'round_not_found'; end if;

    if p_round_effect = 'open' then
      if r.revealed_at is not null then return 'already_revealed'; end if;
      update public.rounds set opened_at = coalesce(opened_at, now()), closed_at = null where id = r.id;
    elsif p_round_effect = 'close' then
      update public.rounds set closed_at = now() where id = r.id;
    elsif p_round_effect = 'reveal' then
      if r.birthday_locked_at is null then return 'waiting_for_birthday'; end if;
      update public.rounds
         set revealed_at = coalesce(revealed_at, now()), closed_at = coalesce(closed_at, now())
       where id = r.id;
    else
      return 'bad_effect';
    end if;
  end if;

  update public.games
     set state = p_state,
         current_index = p_index,
         state_changed_at = now(),
         version = version + 1
   where id = p_game_id;

  return 'ok';
end;
$$;

-- Starts the game: replaces any old rounds with the given list and moves to
-- the intro. p_rounds is a JSON array of
-- {question_id, text, options[], photo_path}.
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

  insert into public.rounds (game_id, round_index, question_id, text, options, photo_path)
  select p_game_id,
         (e.ord - 1)::int,
         nullif(e.val ->> 'question_id', '')::uuid,
         e.val ->> 'text',
         array(select jsonb_array_elements_text(e.val -> 'options')),
         nullif(e.val ->> 'photo_path', '')
    from jsonb_array_elements(p_rounds) with ordinality as e(val, ord);

  update public.games
     set state = 'INTRO', current_index = 0, state_changed_at = now(), version = version + 1
   where id = p_game_id;

  return 'ok';
end;
$$;

-- Back to the lobby: forget rounds and answers, keep players and questions.
create or replace function public.reset_game(p_game_id uuid)
returns text
language plpgsql
set search_path = public
as $$
begin
  perform 1 from public.games where id = p_game_id for update;
  if not found then return 'game_not_found'; end if;
  delete from public.rounds where game_id = p_game_id;
  update public.games
     set state = 'LOBBY', current_index = -1, state_changed_at = now(), version = version + 1
   where id = p_game_id;
  return 'ok';
end;
$$;

-- Functions are executable by PUBLIC by default; only the server may run them.
revoke execute on function public.submit_answer(uuid, uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.birthday_lock(uuid, uuid, int[]) from public, anon, authenticated;
revoke execute on function public.apply_transition(uuid, bigint, text, int, int, text) from public, anon, authenticated;
revoke execute on function public.start_game(uuid, bigint, jsonb) from public, anon, authenticated;
revoke execute on function public.reset_game(uuid) from public, anon, authenticated;
revoke execute on function public.bump_pulse() from public, anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, uuid, int) to service_role;
grant execute on function public.birthday_lock(uuid, uuid, int[]) to service_role;
grant execute on function public.apply_transition(uuid, bigint, text, int, int, text) to service_role;
grant execute on function public.start_game(uuid, bigint, jsonb) to service_role;
grant execute on function public.reset_game(uuid) to service_role;

-- --------------------------------------------------------------- storage --

-- Public-read bucket for photos. Object names are random UUIDs; uploads are
-- only possible through the server (no storage policies for anon/authenticated).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
