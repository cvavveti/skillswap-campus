-- SkillSwap live-app migration. Run this once in Supabase SQL Editor.

alter table public.profiles add column if not exists email text default '';
alter table public.profiles add column if not exists college text default '';
alter table public.profiles add column if not exists course text default '';
alter table public.profiles add column if not exists year text default '';
alter table public.profiles add column if not exists rating numeric not null default 5;
alter table public.profiles add column if not exists availability text default 'Flexible';

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default '',
  description text default '',
  file_name text not null,
  file_type text default 'application/octet-stream',
  file_size bigint not null default 0,
  file_data text,
  uploaded_at timestamptz not null default now(),
  owner_id uuid not null references public.profiles(id) on delete cascade
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(session_id, user_id)
);

alter table public.notes enable row level security;
alter table public.feedback enable row level security;

create policy "Users can view their notes" on public.notes
for select to authenticated using (auth.uid() = owner_id);
create policy "Users can create their notes" on public.notes
for insert to authenticated with check (auth.uid() = owner_id);
create policy "Users can update their notes" on public.notes
for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users can delete their notes" on public.notes
for delete to authenticated using (auth.uid() = owner_id);

create policy "Users can view their feedback" on public.feedback
for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their feedback" on public.feedback
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can create their connections" on public.connections
for insert to authenticated
with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_swap_request_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  canonical_a uuid;
  canonical_b uuid;
  conversation_id uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, message)
    values (new.receiver_id, 'request', 'New exchange request', 'Someone wants to swap skills with you.');
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'accepted' then
    if new.sender_id < new.receiver_id then
      canonical_a := new.sender_id; canonical_b := new.receiver_id;
    else
      canonical_a := new.receiver_id; canonical_b := new.sender_id;
    end if;

    insert into public.connections (user_a_id, user_b_id)
    values (canonical_a, canonical_b)
    on conflict (user_a_id, user_b_id) do nothing;

    select cm1.conversation_id into conversation_id
    from public.conversation_members cm1
    join public.conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
    where cm1.user_id = new.sender_id and cm2.user_id = new.receiver_id
    limit 1;

    if conversation_id is null then
      insert into public.conversations default values returning id into conversation_id;
      insert into public.conversation_members (conversation_id, user_id)
      values (conversation_id, new.sender_id), (conversation_id, new.receiver_id)
      on conflict do nothing;
    end if;

    insert into public.messages (conversation_id, sender_id, content)
    values (conversation_id, new.receiver_id, 'Hi! Your exchange request was accepted. Looking forward to learning together.');

    insert into public.notifications (user_id, type, title, message)
    values (new.sender_id, 'request', 'Exchange request accepted', 'Your exchange request was accepted.');
  end if;
  return new;
end;
$$;

drop trigger if exists swap_request_events on public.swap_requests;
create trigger swap_request_events
after insert or update on public.swap_requests
for each row execute procedure public.handle_swap_request_events();

create or replace function public.handle_message_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member record;
begin
  for member in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, type, title, message)
    values (member.user_id, 'message', 'New message', 'You have a new SkillSwap message.');
  end loop;
  return new;
end;
$$;

drop trigger if exists message_events on public.messages;
create trigger message_events
after insert on public.messages
for each row execute procedure public.handle_message_event();

create or replace function public.handle_session_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.participant_id is not null then
    insert into public.notifications (user_id, type, title, message)
    values (new.participant_id, 'session', 'New session scheduled', new.title || ' is on your calendar.');
  end if;
  return new;
end;
$$;

drop trigger if exists session_events on public.sessions;
create trigger session_events
after insert or update on public.sessions
for each row execute procedure public.handle_session_event();

create index if not exists idx_notes_owner on public.notes(owner_id);
create index if not exists idx_feedback_session on public.feedback(session_id);
