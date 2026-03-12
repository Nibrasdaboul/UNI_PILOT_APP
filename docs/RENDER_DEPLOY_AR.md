# نشر UniPilot على Render — دليل كامل بالعربية

هذا الدليل يوضح كل الخطوات المطلوبة لرفع المشروع على Render بنجاح، بما في ذلك قاعدة البيانات، الدفع الإلكتروني (Stripe)، والذكاء الاصطناعي (Groq)، مع مراعاة المعايير المناسبة للنشر والبيع.

---

## المتطلبات المسبقة

- حساب على [Render](https://render.com)
- حساب على [GitHub](https://github.com) ومستودع المشروع مرفوع عليه
- حساب [Stripe](https://dashboard.stripe.com) (للدفع)
- مفتاح [Groq](https://console.groq.com) (للذكاء الاصطناعي — اختياري)

---

## الجزء 1: إنشاء الخدمة على Render

### 1.1 ربط المستودع

1. ادخل إلى [dashboard.render.com](https://dashboard.render.com)
2. اضغط **New +** → **Web Service**
3. اختر **Connect a repository** وربط حساب GitHub
4. اختر مستودع UniPilot
5. إذا كان المشروع داخل مجلد فرعي (مثل `frontend-vite`)، في **Root Directory** ضع: `frontend-vite`

### 1.2 إعداد البناء والتشغيل

| الحقل | القيمة |
|--------|--------|
| **Name** | `unipilot` (أو أي اسم تريده) |
| **Region** | اختر الأقرب للمستخدمين |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | Free (أو مدفوع لاحقاً) |

### 1.3 إضافة قاعدة البيانات

1. من لوحة Render: **New +** → **PostgreSQL**
2. اختر الخطة (Free للتجربة)
3. بعد الإنشاء، ادخل إلى قاعدة البيانات وانسخ **Internal Database URL** (أو **External** إذا تحتاج من خارج Render)
4. في خدمة الويب (Web Service): **Environment** → أضف متغير:
   - **Key:** `DATABASE_URL`
   - **Value:** الصق رابط الاتصال (من الخطوة 3)
5. إذا استخدمت Blueprint (render.yaml) فقاعدة البيانات تُربط تلقائياً و`DATABASE_URL` يُعيّن من الربط

---

## الجزء 2: متغيرات البيئة الإجبارية

يجب ضبط هذه المتغيرات في **Environment** لخدمة الويب. بدونها التطبيق قد لا يبدأ أو يعمل بشكل خاطئ.

| المتغير | الوصف | مثال |
|---------|--------|------|
| `NODE_ENV` | يُضبط تلقائياً من render.yaml إلى `production` | `production` |
| `DATABASE_URL` | رابط PostgreSQL | يُعيّن من قاعدة Render إن ربطتها |
| `JWT_SECRET` | سر لتوقيع الجلسات (32 حرفاً على الأقل) | سلسلة عشوائية طويلة |
| `VITE_BACKEND_URL` | **رابط التطبيق الكامل** (يُستخدم عند البناء) | `https://unipilot.onrender.com` |
| `APP_URL` | نفس رابط التطبيق (لStripe والعودة بعد الدفع) | `https://unipilot.onrender.com` |
| `FRONTEND_ORIGIN` | أصل الواجهة لـ CORS (نفس الرابط عادة) | `https://unipilot.onrender.com` |

**ملاحظة مهمة:** استبدل `unipilot.onrender.com` برابط خدمتك الفعلي (يظهر بعد أول نشر، مثل `unipilot-xxxx.onrender.com`).

**إنشاء JWT_SECRET آمن:**
- يمكنك استخدام: [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) أو أي مولد سري عشوائي (32+ حرفاً).

---

## الجزء 3: الدفع الإلكتروني (Stripe)

### 3.1 إنشاء المنتجات والأسعار في Stripe

1. ادخل [Stripe Dashboard](https://dashboard.stripe.com) (استخدم **Live** للإنتاج أو **Test** للتجربة)
2. **Product catalog** → **Add product** — أنشئ منتجين:
   - UniPilot Pro (سعر شهري أو سنوي)
   - UniPilot Student (سعر مخفّض)
3. لكل منتج: أنشئ **Price** (Recurring) وانسخ **Price ID** (يبدأ بـ `price_`) أو يمكنك استخدام **Product ID** (`prod_`) والتطبيق يحوّله تلقائياً للسعر الافتراضي

### 3.2 متغيرات Stripe على Render

في **Environment** لخدمة الويب أضف:

| المتغير | من أين |
|---------|--------|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `STRIPE_PUBLISHABLE_KEY` | نفس الصفحة → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | من خطوة الويب هوك (أدناه) |
| `STRIPE_PRO_PLAN_PRICE_ID` | معرّف سعر خطة Pro (`price_...` أو `prod_...`) |
| `STRIPE_STUDENT_PLAN_PRICE_ID` | معرّف سعر خطة Student |

### 3.3 إعداد الويب هوك (Webhook) على Stripe

1. بعد نشر التطبيق على Render، انسخ رابط الخدمة (مثل `https://unipilot-xxxx.onrender.com`)
2. في Stripe: **Developers** → **Webhooks** → **Add endpoint**
3. **Endpoint URL:**  
   `https://YOUR-SERVICE-NAME.onrender.com/api/billing/webhook`
4. **Events to send:** اختر على الأقل:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed` (موصى به)
5. بعد الحفظ، انقر **Reveal** بجانب **Signing secret** وانسخه
6. ضعه في Render كقيمة `STRIPE_WEBHOOK_SECRET`
7. أعد نشر الخدمة (Redeploy) إن لزم

بدون هذا الويب هوك، الاشتراكات لن تُحدَّث في قاعدة البيانات بعد الدفع.

---

## الجزء 4: الذكاء الاصطناعي (Groq)

لتفعيل الأستاذ الذكي والتلخيص والبطاقات وغيرها:

1. احصل على مفتاح API من [Groq Console](https://console.groq.com)
2. في Render → **Environment** أضف:
   - **Key:** `GROQ_API_KEY`
   - **Value:** المفتاح (يبدأ بـ `gsk_`)

بدون هذا المفتاح، الميزات التي تعتمد على AI سترجع رسالة أن الخدمة غير مضبوطة.

---

## الجزء 5: متغيرات اختيارية (مراقبة وأداء)

| المتغير | الوصف |
|---------|--------|
| `SENTRY_DSN` | تتبع أخطاء الباكند (Sentry) |
| `VITE_SENTRY_DSN` | تتبع أخطاء الواجهة (يُضبط عند البناء) |
| `POSTHOG_API_KEY` | تحليلات المنتج (PostHog) |
| `REDIS_URL` | Redis للكاش وقوائم المهام (إن أضفت Redis) |
| `LOG_LEVEL` | مستوى السجل: `error` \| `warn` \| `info` \| `debug` |
| `AI_FREE_MONTHLY_LIMIT` | حد طلبات AI للمجاني شهرياً (افتراضي 50) |

---

## الجزء 6: التحقق بعد النشر

### 6.1 الصحة والجاهزية

- افتح: `https://YOUR-SERVICE.onrender.com/api/health`  
  يجب أن ترى: `{"status":"ok"}`
- افتح: `https://YOUR-SERVICE.onrender.com/api/ready`  
  يجب أن ترى: `{"status":"ready","database":"connected"}`

### 6.2 الواجهة والتسجيل

- افتح الرابط الرئيسي للتطبيق وسجّل مستخدم جديد
- تأكد من ظهور لوحة التحكم والإعدادات

### 6.3 الدفع

- من الإعدادات أو صفحة الأسعار جرّب **ترقية إلى Pro**
- يجب أن يفتح Stripe Checkout
- بعد الدفع (أو إلغاء) يجب العودة للتطبيق
- في الإعدادات → Plan & Billing يجب أن تظهر الخطة المحدّثة بعد الدفع الناجح
- زر **إدارة الاشتراك** يجب أن يفتح Stripe Customer Portal

### 6.4 الذكاء الاصطناعي

- إذا ضبطت `GROQ_API_KEY`: ادخل الأستاذ الذكي (AI Coach) وأرسل رسالة — يجب أن يرد النموذج

---

## الجزء 7: قائمة تحقق سريعة قبل الإطلاق

- [ ] المستودع مربوط على Render و Root Directory صحيح إن لزم
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node server/index.js`
- [ ] قاعدة بيانات PostgreSQL مضافة و`DATABASE_URL` مضبوط
- [ ] `JWT_SECRET` (32+ حرف) مضبوط
- [ ] `VITE_BACKEND_URL` = رابط التطبيق الكامل (يُستخدم عند البناء)
- [ ] `APP_URL` = نفس الرابط
- [ ] `FRONTEND_ORIGIN` = نفس الرابط (أو قائمة أصول مسموحة)
- [ ] Stripe: المفاتيح + معرّفات الخطط + ويب هوك على `/api/billing/webhook` + `STRIPE_WEBHOOK_SECRET`
- [ ] Groq: `GROQ_API_KEY` إن أردت تفعيل AI
- [ ] تم اختبار: الصحة، التسجيل، الدفع، إدارة الاشتراك، و AI إن مُفعّل

---

## مشاكل شائعة وحلولها

| المشكلة | الحل |
|---------|------|
| التطبيق لا يبدأ | تحقق من `JWT_SECRET` (32+ حرف) و`DATABASE_URL` |
| "الدفع غير مفعّل" | أضف كل متغيرات Stripe و`STRIPE_WEBHOOK_SECRET` من صفحة الويب هوك |
| بعد الدفع الخطة لا تتحدث | تأكد أن ويب هوك Stripe يشير لرابط Render الصحيح وأن `STRIPE_WEBHOOK_SECRET` صحيح، ثم أعد النشر |
| CORS / طلبات مرفوضة | ضبط `FRONTEND_ORIGIN` على نفس رابط التطبيق (بدون / في النهاية) |
| الواجهة تتصل بـ localhost | ضبط `VITE_BACKEND_URL` عند البناء على رابط Render ثم إعادة Build |
| AI لا يعمل | ضبط `GROQ_API_KEY` من Groq Console |

---

## مراجع إضافية

- [دليل Stripe بالعربية](STRIPE_SETUP_AR.md)
- [Production Readiness Checklist](PRODUCTION_READINESS_CHECKLIST.md)
- [Deployment Guide (English)](DEPLOYMENT_GUIDE.md)

بعد إكمال كل الخطوات أعلاه يكون المشروع جاهزاً للنشر والاستخدام (بما في ذلك الدفع والذكاء الاصطناعي) وفق معايير مناسبة لموقع إلكتروني قابل للبيع.
