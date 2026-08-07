-- =====================================================================
-- SQL إضافي - تطوير جدول المحاضرات (ترتيب المحاضرات)
-- شغّل الكود ده في SQL Editor بعد باقي ملفات الـ migration
-- =====================================================================

-- لو جدول lectures لسه مش موجود عندك أصلاً، شغّل الكود ده كامل.
-- لو already موجود (من supabase-migration.sql)، هيكتفي بإضافة عمود order_num بس.

create table if not exists lectures (
  id bigint generated always as identity primary key,
  course_id bigint not null references courses(id) on delete cascade,
  title text not null,
  video_url text,
  order_num integer default 0,
  created_at timestamptz default now()
);

alter table lectures add column if not exists order_num integer default 0;

alter table lectures enable row level security;

drop policy if exists "public can read lectures" on lectures;
drop policy if exists "admin can insert lectures" on lectures;
drop policy if exists "admin can update lectures" on lectures;
drop policy if exists "admin can delete lectures" on lectures;

create policy "public can read lectures" on lectures for select
  to anon, authenticated
  using (true);

create policy "admin can insert lectures" on lectures for insert
  to authenticated
  with check (auth.uid() in (select user_id from admins));

create policy "admin can update lectures" on lectures for update
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can delete lectures" on lectures for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));

-- اختياري: رتب المحاضرات الموجودة حاليًا حسب تاريخ الإضافة كبداية
-- (لو عندك محاضرات مضافة قبل كده وعايز تديها ترتيب مبدئي)
-- update lectures set order_num = sub.rn
-- from (
--   select id, row_number() over (partition by course_id order by created_at) as rn
--   from lectures
-- ) sub
-- where lectures.id = sub.id;
