# إعداد PostgreSQL لتطبيق UniPilot

تم تحويل التطبيق لاستخدام **PostgreSQL** بدلاً من SQLite لتحمل عدد كبير من المستخدمين (آلاف الطلاب ومئات الأدمن) مع استجابة سريعة.

---

## الخطوات بالترتيب (بعد ما نزلت PostgreSQL)

| # | الخطوة | كيف |
|---|--------|-----|
| 1 | إنشاء قاعدة البيانات والمستخدم | شغّل **`run-setup-db.bat`** من مجلد المشروع، أو نفّذ الأوامر يدوياً من SQL Shell (انظر تحت). |
| 2 | إنشاء ملف `.env` | في مجلد المشروع (جنب `package.json`) أنشئ ملف اسمه **`.env`**. |
| 3 | إضافة سطر الاتصال | داخل `.env` اكتب سطر واحد: **`DATABASE_URL=postgresql://unipilot_user:UniPilot123@localhost:5432/unipilot`** (لو غيّرت كلمة المرور في الإعداد غيّرها هنا أيضاً). |
| 4 | تشغيل التطبيق | من نفس المجلد: **`npm install`** ثم **`npm run server`**. |

بعدها التطبيق يتصل بـ PostgreSQL وينشئ الجداول تلقائياً أول مرة.

---

## 1) تثبيت PostgreSQL

### على Windows
- حمّل المثبت من: https://www.postgresql.org/download/windows/
- نفّذ المثبت واتبع الخطوات (احفظ كلمة مرور مستخدم `postgres`).
- افتراضيًا الخدمة تعمل على البورت **5432**.

### على macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### على Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 2) إنشاء قاعدة البيانات والمستخدم

### الطريقة الأولى (الأسهل على Windows)

1. افتح **Command Prompt** أو **PowerShell** من مجلد المشروع (مجلد uniPilot أو frontend-vite).
2. شغّل الملف الجاهز:
   ```bat
   run-setup-db.bat
   ```
3. عندما يطلب منك، أدخل **كلمة مرور مستخدم postgres** (اللي حطيتها وقت تثبيت PostgreSQL).
4. إذا ظهر خطأ أن `psql` غير معروف:
   - افتح **SQL Shell (psql)** من قائمة Start (تبحث عنها بـ "psql" أو "SQL Shell").
   - أو من Command Prompt اذهب لمجلد PostgreSQL ثم نفّذ، مثلاً:
     ```bat
     "C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -f server\setup-db.sql
     ```
     (غيّر 16 لرقم إصدارك إن كان مختلفاً.)

### الطريقة الثانية (يدوياً)

1. من قائمة Start افتح **SQL Shell (psql)**.
2. اضغط Enter لكل سطر (Host, Port, Database, User) حتى يطلب كلمة المرور.
3. أدخل كلمة مرور **postgres**.
4. الصق الأوامر التالية ثم Enter:
   ```sql
   CREATE USER unipilot_user WITH PASSWORD 'UniPilot123';
   CREATE DATABASE unipilot OWNER unipilot_user;
   \q
   ```
5. اكتب `\q` ثم Enter للخروج.

---

## 3) متغير البيئة DATABASE_URL

أنشئ أو عدّل ملف **`.env`** في مجلد المشروع (بجانب `package.json`) وأضف سطر الاتصال:

```
DATABASE_URL=postgresql://unipilot_user:كلمة_مرور_قوية@localhost:5432/unipilot
```

**صيغة الرابط:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

- **USER**: اسم المستخدم الذي أنشأته.
- **PASSWORD**: كلمة المرور (إن وُجدت رموز خاصة مثل `@` أو `#` قم بتشفيرها في الرابط أو ضع القيمة بين علامتي اقتباس حسب البيئة).
- **HOST**: `localhost` للتشغيل المحلي، أو عنوان السيرفر/العنوان الذي يعطيك إياه مزود السحابة.
- **PORT**: عادةً `5432`.
- **DATABASE_NAME**: اسم القاعدة، مثلاً `unipilot`.

---

## 4) تشغيل التطبيق

```bash
npm install
npm run server
```

عند أول تشغيل، السيرفر يقرأ ملف **`server/schema-pg.sql`** وينشئ الجداول تلقائياً إن لم تكن موجودة. لا تحتاج لتشغيل أي سكربت SQL يدوياً للبداية.

---

## 5) استضافة سحابية (اختياري)

إذا كنت تنشر التطبيق على سيرفر أو خدمة سحابية:

- **Neon**: https://neon.tech — إنشاء مشروع ثم نسخ Connection string.
- **Supabase**: https://supabase.com — من لوحة التحكم: Project Settings → Database → Connection string (URI).
- **Render**: إضافة PostgreSQL من Dashboard ثم نسخ Internal/External Database URL.
- **Railway / أي مزود آخر**: استخدم رابط الاتصال الذي يوفره المزوّد لـ PostgreSQL.

ضع الرابط في متغير البيئة **`DATABASE_URL`** في بيئة التشغيل (مثلاً في إعدادات المشروع على المنصة)، ولا تضع كلمات المرور في الكود.

---

## 6) ملخص المتطلبات

| المتطلب | الوصف |
|--------|--------|
| **Node.js** | إصدار 18 أو أحدث |
| **PostgreSQL** | إصدار 12 أو أحدث (يفضّل 14–16) |
| **متغير البيئة** | `DATABASE_URL` في ملف `.env` أو في بيئة التشغيل |
| **الحزم** | تم إضافة الحزمة `pg` في المشروع؛ تشغيل `npm install` كافٍ |

بعد ضبط **DATABASE_URL** وتشغيل **npm run server** يكون التطبيق جاهزاً للعمل على PostgreSQL.
