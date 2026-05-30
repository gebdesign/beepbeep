-- beepbeep 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 유저 프로필 테이블
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  match_preference text check (match_preference in ('opposite', 'same', 'all')),
  occupation text,
  income_range text,
  assets_range text,
  car text,
  hobbies text[],
  ideal_type text,
  bio text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'premium', 'premium_plus')),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 위치 테이블 (실시간 위치 업데이트)
create table locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  mode text default 'daily',
  is_mode_active boolean default false,
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- 매칭 테이블
create table matches (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references profiles(id) on delete cascade,
  user2_id uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default now()
);

-- 채팅 메세지 테이블
create table messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text,
  created_at timestamp with time zone default now()
);

-- RLS (Row Level Security) 활성화
alter table profiles enable row level security;
alter table locations enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;

-- 프로필 정책
create policy "누구나 프로필 조회 가능" on profiles for select using (true);
create policy "본인 프로필만 수정 가능" on profiles for update using (auth.uid() = id);
create policy "본인 프로필 생성" on profiles for insert with check (auth.uid() = id);

-- 위치 정책
create policy "활성 모드 위치만 조회 가능" on locations for select using (is_mode_active = true);
create policy "본인 위치만 수정 가능" on locations for all using (auth.uid() = user_id);

-- 매칭 정책
create policy "본인 매칭 조회" on matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "매칭 생성" on matches for insert with check (auth.uid() = user1_id);

-- 메세지 정책
create policy "매칭된 유저만 메세지 조회" on messages for select using (
  exists (
    select 1 from matches
    where matches.id = messages.match_id
    and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
  )
);
create policy "매칭된 유저만 메세지 전송" on messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from matches
    where matches.id = messages.match_id
    and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    and matches.status = 'accepted'
  )
);

-- Realtime 활성화
alter publication supabase_realtime add table locations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;
