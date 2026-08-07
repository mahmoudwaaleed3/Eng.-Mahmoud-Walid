-- =====================================================================
-- SQL إضافي - المرحلة الثانية (نظرة عامة، تصنيفات، طلبات، اشتراكات)
-- شغّل الكود ده بالترتيب في SQL Editor. لازم تكون شغّلت ملف
-- supabase-migration.sql الأول (جدول admins) قبل ما تشغل ده.
-- =====================================================================

-- -----------------------------------------------------------------
-- 1) جدول التصنيفات
-- -----------------------------------------------------------------
create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "public can read categories" on categories for select
  to anon using (true);

create policy "admin can insert categories" on categories for insert
  to authenticated with check (auth.uid() in (select user_id from admins));

create policy "admin can update categories" on categories for update
  to authenticated using (auth.uid() in (select user_id from admins));

create policy "admin can delete categories" on categories for delete
  to authenticated using (auth.uid() in (select user_id from admins));


-- -----------------------------------------------------------------
-- 2) إضافة عمود التصنيف وحالة النشر لجدولي courses وbooks
-- -----------------------------------------------------------------
alter table courses add column if not exists category_id bigint references categories(id) on delete set null;
alter table books   add column if not exists category_id bigint references categories(id) on delete set null;

alter table courses add column if not exists status text not null default 'published';
alter table books   add column if not exists status text not null default 'published';
-- status: 'published' أو 'draft'. الكورس/الكتاب اللي status بتاعه draft
-- مش هيظهر في صفحة "كورساتي" العامة للزوار، بس هيفضل ظاهر في لوحة الأدمن.


-- -----------------------------------------------------------------
-- 3) جدول الطلبات (تسجيل يدوي لعمليات الدفع لحد ما نضيف بوابة دفع حقيقية)
-- -----------------------------------------------------------------
create table if not exists orders (
  id bigint generated always as identity primary key,
  student_name text not null,
  contact text,                         -- إيميل أو رقم الطالب
  product_type text not null check (product_type in ('course','book')),
  product_id bigint not null,           -- id بتاع الكورس أو الكتاب (بدون foreign key لأنه بيشير لجدولين مختلفين)
  price numeric,
  payment_method text,                  -- فودافون كاش / تحويل بنكي / إنستاباي...
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  created_at timestamptz default now()
);

alter table orders enable row level security;

create policy "admin can read orders" on orders for select
  to authenticated using (auth.uid() in (select user_id from admins));

create policy "admin can insert orders" on orders for insert
  to authenticated with check (auth.uid() in (select user_id from admins));

create policy "admin can update orders" on orders for update
  to authenticated using (auth.uid() in (select user_id from admins));

create policy "admin can delete orders" on orders for delete
  to authenticated using (auth.uid() in (select user_id from admins));


-- -----------------------------------------------------------------
-- 4) جدول الاشتراكات الفعلية (اللي بتفتح الوصول للمحتوى فعليًا)
--    لما الأدمن "يأكد" طلب، بيتحط سطر هنا تلقائي.
--    الطالب نفسه (لما يكون مسجل دخول بنفس الإيميل) يقدر يشوف اشتراكاته بس، مش اشتراكات غيره.
-- -----------------------------------------------------------------
create table if not exists enrollments (
  id bigint generated always as identity primary key,
  student_email text not null,
  product_type text not null check (product_type in ('course','book')),
  product_id bigint not null,
  created_at timestamptz default now(),
  unique(student_email, product_type, product_id)
);

alter table enrollments enable row level security;

create policy "user can read own enrollments" on enrollments for select
  to authenticated using (lower(auth.jwt() ->> 'email') = lower(student_email));

create policy "admin can read all enrollments" on enrollments for select
  to authenticated using (auth.uid() in (select user_id from admins));

create policy "admin can insert enrollments" on enrollments for insert
  to authenticated with check (auth.uid() in (select user_id from admins));

create policy "admin can delete enrollments" on enrollments for delete
  to authenticated using (auth.uid() in (select user_id from admins));


-- =====================================================================
-- ملاحظات مهمة:
--
-- 1) "إدارة صلاحيات الوصول" المطلوبة في طلبك بتتم من تبويب
--    "الطلبات والاشتراكات" في اللوحة: تقدر تفعّل أو تلغي اشتراك
--    أي طالب في أي كورس/كتاب يدويًا بإيميله، من غير ما يكون له طلب
--    (order) أصلاً.
--
-- 2) قسم "إدارة المستخدمين" اللي طلبته: مينفعش تقنيًا نبني صفحة
--    تعرض كل حسابات Supabase Auth المسجلة مباشرة من المتصفح، لأن
--    ده يحتاج مفتاح "service_role" السري، ومينفعش نحطه في كود
--    الموقع لأي حد يقدر يشوفه ويتحكم بيه بالكامل في حساباتك. البديل
--    الآمن اللي عملناه: تبويب العملاء (customers) بيسمحلك تدور
--    وتشوف كل حد سجل بياناته من فورمة التواصل، وتبويب الاشتراكات
--    بيسمحلك تدير وصول أي إيميل. لو عايز عرض كامل لكل المستخدمين
--    المسجلين فعليًا (مش بس اللي بعتوا فورمة)، ده محتاج نضيف
--    "Edge Function" بسيطة تشتغل بمفتاح service_role من على السيرفر
--    مش من المتصفح — قولي لو عايز نعملها في خطوة تانية.
--
-- 3) بنفس المنطق، مفيش UI في اللوحة لتغيير API Keys أو بيانات بوابات
--    الدفع، لأن أي مفتاح سري (زي service_role أو مفاتيح بوابة دفع)
--    لازم يفضل بره كود المتصفح تمامًا. تقدر تغيّرهم من إعدادات
--    Supabase نفسها مباشرة، وده أأمن بكتير من أي لوحة تحكم مبنية
--    بـ HTML/JS عادي.
-- =====================================================================
