# رفع مشروع UniPilot على Render.com

دليل خطوة بخطوة لرفع UniPilot على Render بشكل مجاني.

---

## قائمة التحقق قبل الرفع (Web Service واحد)

- [ ] المشروع مرفوع على GitHub (مجلد `frontend-vite` أو المستودع الذي بداخله `frontend-vite`).
- [ ] على Render: **New → Web Service** وربط المستودع.
- [ ] **Root Directory:** `frontend-vite`
- [ ] **Build Command:** `npm install && npm run build`
- [ ] **Start Command:** `node server/index.js`
- [ ] في **Environment** أضفت: `NODE_ENV` = `production`، `VITE_BACKEND_URL` = رابط خدمتك (مثل `https://unipilot.onrender.com`)، `GROQ_API_KEY` = مفتاحك.
- [ ] بعد أول نشر: إن لم تكن أضفت `VITE_BACKEND_URL` قبل البناء، أضفها ثم **Redeploy**.

---

## مهم: ملف `.env` لا يُرفع إلى GitHub (وهذا صحيح)

ملف `.env` موجود في `.gitignore` فلا يظهر على GitHub — **وهذا مقصود لأسباب أمنية** (يحتوي مفاتيح مثل GROQ_API_KEY).  
على **Render** تضبط المتغيرات من **لوحة التحكم (Dashboard)** وليس من الملف:

1. افتح خدمتك على Render → **Environment**.
2. أضف المتغيرات يدوياً (مثل `VITE_BACKEND_URL` و `GROQ_API_KEY`).

محلياً: انسخ `.env.example` إلى `.env` واملأ القيم. لا ترفع `.env` إلى GitHub أبداً.

---

## الطريقة الموصى بها: خدمة واحدة (Web Service فقط)

واجهة + API معاً على **Web Service** واحد. ارفع الكود واتبع الخطوات التالية.

### إعدادات الخدمة على Render

| الحقل | القيمة |
|--------|--------|
| **Name** | `unipilot` (أو أي اسم) |
| **Region** | الأقرب لك |
| **Root Directory** | `frontend-vite` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | **Free** |

### متغيرات البيئة (في Dashboard → Environment)

يجب إضافتها يدوياً (لأن `.env` لا يُرفع):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `VITE_BACKEND_URL` | **نفس رابط خدمتك** بدون `/` في الآخر، مثال: `https://unipilot.onrender.com` |
| `GROQ_API_KEY` | مفتاحك من [console.groq.com](https://console.groq.com) |

**مهم:** `VITE_BACKEND_URL` يُدمج في الواجهة وقت البناء فقط، لذلك يجب أن يكون مضبوطاً قبل أول Deploy (أو اعمل Redeploy بعد إضافته).

**بديل لمفتاح الذكاء الاصطناعي (GROQ):** يمكنك وضع المفتاح في ملف بدل متغير البيئة:
- افتح الملف `server/groq-key.txt` واستبدل النص `PASTE_YOUR_GROQ_KEY_HERE` بمفتاحك من [console.groq.com](https://console.groq.com) (سطر واحد فقط).
- ارفع الملف مع المشروع إلى GitHub؛ السيرفر سيقرأ المفتاح من الملف ويعمل المستشار الذكي على Render بدون إعداد Environment.
- **تحذير:** من يصل إلى مستودعك على GitHub سيرى المفتاح. للأمان الأفضل استخدم متغير البيئة في Render ولا ترفع الملف بمفتاح حقيقي.

### بعد النشر

- افتح رابط الخدمة (مثل `https://unipilot.onrender.com`) — ستظهر الواجهة وتتصل بالـ API تلقائياً.
- للتحقق من الـ API: `https://YOUR-SERVICE.onrender.com/api/health` → `{"status":"ok"}`.

---

## الطريقة البديلة: خدمتان (Web Service + Static Site)

| الجزء | النوع على Render | الوصف |
|------|------------------|--------|
| **Backend** | Web Service | سيرفر Node/Express + SQLite |
| **Frontend** | Static Site | موقع ثابت (Vite) يتصل بالـ API |

**ملاحظة عن قاعدة البيانات:** على الخطة المجانية من Render، الملفات على السيرفر **مؤقتة** (تُمسح عند إعادة التشغيل أو إعادة النشر). أي بيانات في SQLite قد تُفقد. إذا أردت حفظ البيانات بشكل دائم يمكن لاحقاً استخدام PostgreSQL المجاني على Render.

---

## المتطلبات قبل البدء

1. حساب على [Render.com](https://render.com) (مجاني).
2. المشروع مرفوع على **GitHub** (أو GitLab).
3. أن يكون المشروع يبني ويشتغل محلياً (مجلد `frontend-vite`).

---

## الجزء 1: رفع السيرفر (Backend) على Render

### الخطوة 1: إنشاء Web Service جديد

1. ادخل إلى [dashboard.render.com](https://dashboard.render.com).
2. اضغط **New +** ثم اختر **Web Service**.
3. اختر **Connect a repository** وربط المستودع (Repo) الذي فيه المشروع.
4. إذا لم يكن المستودع مربوطاً، اضغط **Connect GitHub** واختر المستودع ثم أذن لـ Render بالوصول.

### الخطوة 2: إعدادات الخدمة (Backend)

استخدم الإعدادات التالية **بالضبط**:

| الحقل | القيمة |
|--------|--------|
| **Name** | `unipilot-api` (أو أي اسم تفضله) |
| **Region** | اختر الأقرب لك (مثلاً Frankfurt) |
| **Root Directory** | `frontend-vite` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | **Free** |

### الخطوة 3: متغيرات البيئة (اختياري)

في تبويب **Environment** يمكنك إضافة:

- `NODE_ENV` = `production`

لا تحتاج إلى `PORT`؛ Render يضيفه تلقائياً.

### الخطوة 4: النشر

1. اضغط **Create Web Service**.
2. انتظر حتى تنتهي عملية البناء والنشر (قد تستغرق بضع دقائق).
3. بعد النجاح، ستظهر رسالة خضراء وتظهر **عنوان الخدمة**، مثل:
   ```text
   https://unipilot-api.onrender.com
   ```
4. احفظ هذا الرابط؛ ستحتاجه للواجهة.
5. تأكد أن الـ API يعمل بفتح في المتصفح:
   ```text
   https://YOUR-SERVICE-NAME.onrender.com/api/health
   ```
   يجب أن ترى: `{"status":"ok"}`.

---

## الجزء 2: رفع الواجهة (Frontend) على Render

### الخطوة 1: إنشاء Static Site جديد

1. من الـ Dashboard اضغط **New +** ثم اختر **Static Site**.
2. اختر **نفس المستودع** المستخدم للـ Backend.

### الخطوة 2: إعدادات الواجهة

| الحقل | القيمة |
|--------|--------|
| **Name** | `unipilot` (أو أي اسم) |
| **Root Directory** | `frontend-vite` |
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

### الخطوة 3: متغير البيئة المهم (للاتصال بالـ API)

يجب أن تعرف الواجهة عنوان الـ API **أثناء البناء**:

1. في نفس الصفحة، افتح قسم **Environment** (Environment Variables).
2. اضغط **Add Environment Variable**.
3. أضف:
   - **Key:** `VITE_BACKEND_URL`
   - **Value:** عنوان الـ Backend الذي حفظته، **بدون** شريط في الآخر، مثل:
     ```text
     https://unipilot-api.onrender.com
     ```

**مهم:** لا تكتب `/api` في آخر الرابط؛ الكود يضيفها تلقائياً.

### الخطوة 4: النشر

1. اضغط **Create Static Site**.
2. انتظر انتهاء البناء والنشر.
3. بعد النجاح، Render يعطيك رابط الموقع، مثل:
   ```text
   https://unipilot.onrender.com
   ```

---

## الجزء 3: التأكد من أن كل شيء يعمل

1. افتح رابط الـ **Static Site** (الواجهة) في المتصفح.
2. سجّل دخول أو أنشئ حساباً.
3. إذا سجّلت الدخول وظهرت البيانات أو لوحة التحكم، فالواجهة تتصل بالـ API بنجاح.

إذا ظهرت رسالة مثل "لا يمكن الاتصال" أو بقيت الواجهة في وضع Demo، راجع:

- أن `VITE_BACKEND_URL` مضبوط بشكل صحيح (نفس رابط الـ Backend).
- أنك أعدت النشر (Redeploy) للـ Static Site **بعد** إضافة أو تعديل `VITE_BACKEND_URL`، لأن القيمة تُدمج في الواجهة وقت البناء فقط.

---

## ملخص الروابط

بعد النشر ستكون عندك تقريباً:

| الخدمة | الرابط النموذجي |
|--------|------------------|
| **الواجهة (الموقع)** | `https://unipilot.onrender.com` |
| **الـ API (السيرفر)** | `https://unipilot-api.onrender.com` |
| **التحقق من صحة الـ API** | `https://unipilot-api.onrender.com/api/health` |

---

## إصلاح خطأ Content-Security-Policy (الواجهة لا تعمل / img-src blocked)

إذا ظهرت في الكونسول رسالة مثل:
`The page's settings blocked the loading of a resource (img-src) ... violates "default-src 'none'"`

فهذا يعني أن **سياسة أمان المحتوى (CSP)** مضبوطة بشكل يمنع تحميل الموارد (صور، سكربتات، إلخ) فتبقى الصفحة فارغة.

**الحل من لوحة Render:**

1. ادخل إلى [dashboard.render.com](https://dashboard.render.com) وافتح خدمة **الواجهة (Static Site)**.
2. من القائمة الجانبية اختر **Settings** ثم **Headers** (أو **Custom Headers**).
3. إذا وجدت هيدر باسم **Content-Security-Policy** وقيمته تحتوي على `default-src 'none'`:
   - **إما** احذف هذا الهيدر بالكامل (إذا لم تضعه أنت عمداً)، **أو**
   - **أو** استبدل قيمته بالسياسة التالية (نسخ ولصق كما هي):

```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: *.onrender.com wss:; frame-ancestors 'self';
```

4. احفظ التغييرات. قد تحتاج إلى **Manual Deploy** أو انتظر دقيقة ثم حدّث الصفحة.

بعد ذلك يجب أن تعمل الواجهة وتُحمّل الصور والسكربتات واتصال الـ API بشكل طبيعي.

---

## إصلاح: Build failed — Could not load .../src/pages/LandingPage (ENOENT)

إذا ظهر خطأ مثل: `Could not load .../src/src/pages/LandingPage: ENOENT: no such file or directory`

**السبب المحتمل:** المستودع على GitHub لا يحتوي مجلد `src` (أو محتوياته) في نفس مستوى `package.json`.

**ما تفعله:**

1. **تأكد من هيكل المستودع:**  
   إذا كان **Root Directory** على Render = `frontend-vite`، يجب أن يكون على GitHub:
   - `frontend-vite/package.json`
   - `frontend-vite/vite.config.js`
   - `frontend-vite/src/` (المجلد كامل مع `App.jsx` و `pages/` و `components/` إلخ)

2. **من جهازك (مجلد المشروع):**
   - تأكد أنك ترفع من المجلد الذي فيه `frontend-vite` (أو أن المستودع هو محتوى `frontend-vite` نفسه).
   - تحقق أن `src` غير موجود في `.gitignore`.
   - نفّذ: `git add src/` ثم `git status` وتأكد أن ملفات مثل `src/pages/LandingPage.jsx` مضافة، ثم commit و push.

3. **بعد تعديل `vite.config.js`:** تم ضبط المسار باستخدام `import.meta.url` و `root` صريح؛ ارفع التعديلات واعمل **Redeploy** على Render.

---

## نصائح إضافية

- **النوم (Spin down):** على الخطة المجانية، السيرفر ينام بعد فترة عدم استخدام. أول طلب بعد الاستيقاظ قد يأخذ 30–60 ثانية، ثم يعود كل شيء طبيعي.
- **قاعدة البيانات:** كما ذكرنا، على الخطة المجانية بيانات SQLite قد تُفقد عند إعادة تشغيل أو إعادة نشر الـ Web Service. للاحتفاظ بالبيانات بشكل دائم يمكن لاحقاً إنشاء **PostgreSQL** مجاني على Render وتعديل المشروع لاستخدامها بدل SQLite.
- **تحديث الموقع:** عند دفع تغييرات جديدة إلى GitHub، Render يعيد النشر تلقائياً إذا كان **Auto-Deploy** مفعّلاً (وهو افتراضي).

إذا واجهت خطأ معيّن (مثل فشل البناء أو 404)، اذكر اسم الخدمة (Backend أو Frontend) ورسالة الخطأ لأتمكن من توجيهك خطوة إضافية.
