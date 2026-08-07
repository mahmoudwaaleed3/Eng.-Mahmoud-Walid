-- =====================================================================
-- SQL إضافي - المرحلة الثالثة (الإشعارات والدعم الفني)
-- شغّل الكود ده في SQL Editor بعد ما تكون شغّلت
-- supabase-migration.sql و supabase-migration-2.sql
-- =====================================================================

-- -----------------------------------------------------------------
-- 1) جدول الإشعارات الجماعية
--    أي حساب مسجّل دخول (طالب أو أدمن) يقدر يقراها، بس الأدمن بس
--    اللي يقدر يضيف أو يمسح
-- -----------------------------------------------------------------
create table if not exists notifications (
  id bigint generated always as identity primary key,
  title text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "authenticated can read notifications" on notifications for select
  to authenticated using (true);

create policy "admin can insert notifications" on notifications for insert
  to authenticated with check (auth.uid() in (select user_id from admins));

create policy "admin can delete notifications" on notifications for delete
  to authenticated using (auth.uid() in (select user_id from admins));


-- -----------------------------------------------------------------
-- 2) جدول أسئلة الطلاب تحت المحاضرات
--    الطالب يقدر يشوف ويضيف أسئلته هو بس، والأدمن يقدر يشوف
--    ويرد على كل الأسئلة
-- -----------------------------------------------------------------
create table if not exists support_questions (
  id bigint generated always as identity primary key,
  student_email text not null,
  lecture_id bigint references lectures(id) on delete set null,
  question text not null,
  admin_reply text,
  created_at timestamptz default now()
);

alter table support_questions enable row level security;

create policy "student can insert own question" on support_questions for insert
  to authenticated
  with check (lower(auth.jwt() ->> 'email') = lower(student_email));

create policy "student can read own questions" on support_questions for select
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower(student_email));

create policy "admin can read all questions" on support_questions for select
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can update questions" on support_questions for update
  to authenticated
  using (auth.uid() in (select user_id from admins));

-- =====================================================================
-- ملاحظة: تبويب "الدعم والإشعارات" في اللوحة بيعرض ويرد على الأسئلة
-- اللي موجودة في الجدول ده، لكن لسه محتاجين نضيف الواجهة اللي
-- الطالب نفسه بيسأل منها في صفحة "كورساتي" — دي خطوة تالية لو حابب.
-- =====================================================================
