-- Event Quiz: games belong to signed-in users, have a template (look, feel
-- and starter questions) and a language. The star can be "she", "he" or a
-- couple ("plural").

alter table public.games
  add column owner_id uuid references auth.users (id) on delete set null,
  add column template text not null default 'birthday' check (template in (
    'birthday', 'kids_birthday', 'kids', 'wedding', 'mitzvah', 'baby_shower', 'anniversary', 'party')),
  add column locale text not null default 'he' check (locale in ('he', 'en'));

alter table public.games drop constraint games_birthday_gender_check;
alter table public.games add constraint games_birthday_gender_check
  check (birthday_gender in ('female', 'male', 'plural'));

create index games_owner_idx on public.games (owner_id, created_at desc);
