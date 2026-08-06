-- =====================================================================
-- SQL كامل لازم تشغله في Supabase SQL Editor بالترتيب اللي تحت
-- =====================================================================

-- -----------------------------------------------------------------
-- 1) جدول الأدمن: عشان نفرّق بين أي حساب عادي (طالب) وحساب الأدمن
--    ده أهم جزء أمني بعد ما بقى أي زائر يقدر يعمل حساب بنفسه
-- -----------------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admins enable row level security;
-- مفيش أي policy هنا يعني مفيش أي حد (لا anon ولا authenticated) يقدر يقرا الجدول ده مباشرة من المتصفح، وده مقصود.


-- -----------------------------------------------------------------
-- 2) تسجيل حسابك انت كأدمن
--    اعمل حساب الأول من صفحة admin-login.html (أو من Authentication > Users > Add user)
--    وبعدين هات الـ UUID بتاعه من نفس الصفحة دي في Supabase وحطه هنا:
-- -----------------------------------------------------------------
insert into admins (user_id)
values ('PASTE-YOUR-ADMIN-USER-UUID-HERE')
on conflict (user_id) do nothing;


-- -----------------------------------------------------------------
-- 3) تحديث صلاحيات جدول customers
--    (بدل ما كانت "أي حساب مسجل دخول" بقت "الأدمن بس")
-- -----------------------------------------------------------------
drop policy if exists "admin can read" on customers;
drop policy if exists "admin can update" on customers;
drop policy if exists "admin can delete" on customers;

create policy "admin can read" on customers for select
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can update" on customers for update
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can delete" on customers for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));


-- -----------------------------------------------------------------
-- 4) تحديث صلاحيات جدولي courses وbooks بنفس المنطق
-- -----------------------------------------------------------------
drop policy if exists "admin can insert courses" on courses;
drop policy if exists "admin can update courses" on courses;
drop policy if exists "admin can delete courses" on courses;

create policy "admin can insert courses" on courses for insert
  to authenticated
  with check (auth.uid() in (select user_id from admins));

create policy "admin can update courses" on courses for update
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can delete courses" on courses for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));

drop policy if exists "admin can insert books" on books;
drop policy if exists "admin can update books" on books;
drop policy if exists "admin can delete books" on books;

create policy "admin can insert books" on books for insert
  to authenticated
  with check (auth.uid() in (select user_id from admins));

create policy "admin can update books" on books for update
  to authenticated
  using (auth.uid() in (select user_id from admins));

create policy "admin can delete books" on books for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));

-- ملحوظة: صلاحية القراءة العامة (anon select) لجدولي courses وbooks
-- وصلاحية الإضافة العامة (anon insert) لجدول customers لسه زي ما هي، مش محتاجة تغيير.


-- -----------------------------------------------------------------
-- 5) إضافة عمود رابط الملف (PDF) لجدول books
-- -----------------------------------------------------------------
alter table books add column if not exists file_url text;


-- -----------------------------------------------------------------
-- 6) جدول المحاضرات (لكل كورس مجموعة محاضرات)
--
-- ⚠️ مهم جدًا: لازم "id" بتاع جدول courses يكون من نفس نوع
-- "course_id" اللي تحت. الكود ده مكتوب على افتراض إن id بتاع
-- courses من نوع bigint (ده الافتراضي لو عملت الجدول من واجهة
-- Supabase Table Editor العادية). لو عندك id من نوع uuid بدل
-- كده، غيّر السطر "course_id bigint" لـ "course_id uuid" قبل ما
-- تشغل الكود.
-- -----------------------------------------------------------------
create table if not exists lectures (
  id bigint generated always as identity primary key,
  course_id bigint not null references courses(id) on delete cascade,
  title text not null,
  video_url text,
  created_at timestamptz default now()
);

alter table lectures enable row level security;

create policy "public can read lectures" on lectures for select
  to anon
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

-- =====================================================================
-- خلاص كده. بعد ما تشغل السطور دي كلها، جرب:
-- 1. تدخل admin-login.html بحساب الأدمن، وتتأكد إن لوحة التحكم شغالة عادي
-- 2. تعمل حساب جديد (طالب عادي) من login.html في نافذة تانية،
--    وتتأكد إن admin-dashboard.html مايفتحش أو يديله error لو حاول يوصله
-- 3. تضيف كورس من لوحة الأدمن، تدوس "المحاضرات"، وتضيف محاضرة تجريبية
-- =====================================================================
