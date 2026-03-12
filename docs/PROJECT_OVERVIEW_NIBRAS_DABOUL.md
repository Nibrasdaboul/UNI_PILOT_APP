# UniPilot — توثيق المشروع

**المالك:** Nibras Daboul  
**الاسم التجاري للتطبيق:** UniPilot — Your Smart Academic Companion  
**الإصدار:** 0.1.0 (جاهز للإطلاق كنظام SaaS تعليمي مع اشتراكات وذكاء اصطناعي)

هذا الملف هو توثيق رسمي للمشروع باسمك، ويجمع أهم المعلومات الفنية والمنتجية وروابط المستندات التفصيلية.

---

## 1. نظرة عامة على المنتج

- **الفكرة:** مساعد جامعي ذكي للطلاب، يجمع بين:
  - تتبع المعدل (GPA) والسجل الأكاديمي
  - مخطط دراسة (Planner) بالمهام والأحداث
  - تلخيص محاضرات ونصوص
  - بطاقات تعليمية واختبارات ومخططات ذهنية
  - أستاذ ذكي (AI Coach) و أدوات صوت (تسجيل/تفريغ/قراءة نص)
  - لوحة تحكم للإدارة (Admins) لإدارة الطلاب والمقررات والإحصائيات
- **الأدوار:**
  - **Student:** كل وظائف التعلم، التخطيط، الذكاء الاصطناعي، التصدير، وحذف الحساب.
  - **Admin:** جميع وظائف الطالب + إدارة المستخدمين، الكاتالوج، الإشعارات، واستخدام الذكاء الاصطناعي.

تفاصيل أوسع: `PRODUCT_SPEC.md` و `PRODUCTION_READINESS_REPORT.md`.

---

## 2. التكنولوجيا والبنية

- **الواجهة (Frontend):** React 18 + Vite 5 + TailwindCSS + Radix UI + سياقات (Theme/Language/Auth).
- **الخلفية (Backend):** Node.js 18+، Express 4، PostgreSQL (pg)، JWT، bcrypt، Groq SDK، Stripe.
- **قاعدة البيانات:** PostgreSQL مع مخطط كامل وهجرات (schema-pg.sql + server/migrations).
- **النشر:** خدمة Web واحدة على Render:
  - `npm install && npm run build`
  - `node server/index.js` (API + ملفات frontend من `dist/`).

المراجع التقنية:

- معمارية: `documentation/ARCHITECTURE.md`
- إعداد المطور: `docs/DEVELOPER_SETUP.md`
- دليل النشر الإنجليزي: `docs/DEPLOYMENT_GUIDE.md`
- تقرير الجاهزية: `PRODUCTION_READINESS_REPORT.md`

---

## 3. الأمان والجودة

- **أمان:**
  - JWT مع سر إنتاجي (`JWT_SECRET` ≥ 32 حرفاً).
  - Helmet + CORS + Rate limiting (عام وعلى مسارات الدخول).
  - كل الاستعلامات SQL باستخدام معاملات (Parameterized queries).
  - Webhook Stripe يتحقق من التوقيع (`STRIPE_WEBHOOK_SECRET`).
  - دليل أمني: `docs/SECURITY.md`.
- **الجودة والاختبارات:**
  - Unit tests (خدمات + middleware + lib) مع Vitest.
  - API tests (تكامل مع قاعدة البيانات).
  - Playwright E2E (اختياري) + GitHub Actions CI (build + tests).
  - توثيق الاستراتيجية: `docs/TESTING_STRATEGY.md`.

---

## 4. SaaS والاشتراكات (Stripe)

- **الخطط:** Free / Pro / Student، مع عدّاد لاستخدام الذكاء الاصطناعي في المجاني، وذكاء غير محدود في المدفوع.
- **جداول قاعدة البيانات:** `plans`, `subscriptions`, `usage_tracking`, `ai_requests`, `analytics_events`.
- **المنطق:** موجود في `server/services/subscriptionService.js` و `server/routes/billing.js`.
- **واجهة المستخدم:**
  - صفحة `Pricing` للترقية (Stripe Checkout).
  - تبويب Plan & Billing في `Settings` لعرض الخطة/الاستخدام وفتح Stripe Customer Portal.

إعداد Stripe بالعربية: `docs/STRIPE_SETUP_AR.md`.  
النشر على Render (مع Stripe): `docs/RENDER_DEPLOY_AR.md` (يتضمن جميع المتغيرات المطلوبة).

---

## 5. نظام الذكاء الاصطناعي (AI)

- **المزود:** Groq (نماذج Llama) عبر `groq-sdk`.
- **الاستخدام:** أستاذ ذكي (AI Coach)، تلخيص، بطاقات، اختبارات، مخططات ذهنية، أدوات صوت (TTS/تفريغ).
- **الضبط:** متغير بيئة واحد رئيسي `GROQ_API_KEY` في الخادم.
- **الحدود:** لكل مستخدم حسب الخطة (Free / Pro / Student) مع تتبع الطلبات في `ai_requests` و `usage_tracking`.

تفاصيل فنية: `docs/AI_PIPELINE.md` و `server/ai/groq.js` و `server/routes/ai.js`.

---

## 6. النشر على Render ومعايير الإنتاج

- **Blueprint:** `render.yaml` (خدمة Web + PostgreSQL).
- **متغيرات إلزامية على Render:**
  - `DATABASE_URL` (من قاعدة البيانات)
  - `JWT_SECRET` (قوي)
  - `VITE_BACKEND_URL` (رابط التطبيق الكامل، مثال: `https://unipilot.onrender.com`)
  - `APP_URL` (نفس رابط التطبيق؛ يُستخدم لعودة Stripe بعد الدفع)
  - `FRONTEND_ORIGIN` (نفس الرابط أو قائمة أصول مسموحة)
- **متغيرات Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PLAN_PRICE_ID`, `STRIPE_STUDENT_PLAN_PRICE_ID`.
- **متغيرات AI:** `GROQ_API_KEY` (اختياري إن أردت AI).

دليل عربي كامل للنشر على Render: `docs/RENDER_DEPLOY_AR.md`.  
قائمة الجاهزية النهائية: `docs/PRODUCTION_READINESS_CHECKLIST.md`.

---

## 7. الترخيص والملكية

- **الترخيص الحالي في المشروع:** MIT (ملف `LICENSE`). يمكنك تعديل نص الكوبي رايت ليشمل اسمك (مثلاً `Copyright (c) 2025 
Nibras Daboul`).
- يحق لك استخدام الكود وتعديله وبيعه حسب شروط رخصة MIT، مع الإبقاء على إشعار الرخصة داخل التوزيعات.

---

## 8. اختبار Stripe ببطاقة ائتمانية افتراضية (Test Mode)

### 8.1 تشغيل Stripe في وضع الاختبار

1. ادخل إلى [Stripe Dashboard](https://dashboard.stripe.com).
2. فعّل **Test mode** من الأعلى (المفتاح يكون `sk_test` / `pk_test`).\n3. تأكد أن مفاتيح البيئة في Render أو `.env` تستخدم مفاتيح **Test** (وليس Live) أثناء التجربة.

### 8.2 استخدام بطاقات اختبار Stripe

Stripe يوفر بطاقات تجريبية لا تقوم بأي سحب حقيقي. أشهر بطاقة:\n\n- **رقم البطاقة:** `4242 4242 4242 4242`\n- **تاريخ الانتهاء:** أي تاريخ مستقبلي (مثلاً 12/34)\n- **CVC:** أي 3 أرقام (مثلاً 123)\n- **ZIP / Postal code:** أي رقم (مثلاً 12345)\n\nخطوات الاختبار داخل UniPilot:\n\n1. افتح التطبيق المنشور على Render.\n2. سجّل الدخول بحساب طالب.\n3. اذهب إلى صفحة **Pricing**.\n4. اضغط **Upgrade to Pro** أو **Upgrade Student**.\n5. سيتم نقلك إلى صفحة Stripe Checkout.\n6. أدخل بيانات البطاقة التجريبية (المذكورة أعلاه).\n7. بعد إكمال الدفع بنجاح، سيتم توجيهك تلقائياً إلى التطبيق (رابط `APP_URL` مع بارامترات النجاح).\n8. افتح صفحة **Settings → Plan & Billing**:\n   - يجب أن تظهر خطتك الجديدة (Pro أو Student).\n   - يجب أن يعمل زر **Manage subscription** ويفتح Stripe Customer Portal.\n\n> ملاحظة: في وضع الاختبار Test Mode، كل المعاملات وهمية ولا تُسحب أي أموال حقيقية.\n\nلمزيد من أمثلة البطاقات التجريبية (رفض، ثلاثي الأبعاد 3D Secure، الخ): \n[Stripe testing cards](https://docs.stripe.com/testing#cards).\n*** End Patch】"}}
