# تفعيل Stripe والفوترة — دليل خطوة بخطوة (بالعربية)

هذا الدليل يشرح كيف تنشئ حساب Stripe، تحصل على المفاتيح، تنشئ خطط الاشتراك (Pro و Student)، وتضبط الويب هوك ومتغيرات البيئة في UniPilot.

---

## 1. إنشاء حساب Stripe

1. ادخل إلى: **[https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)**
2. سجّل بريدك الإلكتروني وكلمة المرور (أو سجّل الدخول عبر Google).
3. أكد البريد الإلكتروني إذا طُلب منك.
4. في لوحة التحكم (Dashboard) اختر بلدك — هذا يحدد العملة (مثلاً USD أو SAR حسب المنطقة).
5. (اختياري) لتفعيل استلام المدفوعات فعلياً: املأ بيانات الأعمال والبنك في **Settings → Business settings** و **Payouts**؛ يمكنك البدء بوضع **Test mode** دون إكمال كل التفاصيل.

---

## 2. وضع الاختبار (Test mode)

- في أعلى لوحة Stripe ستجد مفتاح **Test mode** (وضع الاختبار).اتركه **مفعّلاً** أثناء التطوير.
- في وضع الاختبار:
  - المفاتيح تبدأ بـ `pk_test_` و `sk_test_`.
  - لا تُجرى مدفوعات حقيقية؛ يمكنك استخدام [بطاقات اختبار Stripe](https://docs.stripe.com/testing#cards) مثل `4242 4242 4242 4242`.

---

## 3. الحصول على مفاتيح API (API Keys)

1. من لوحة Stripe: **Developers → API keys**  
   أو: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. ستجد:
   - **Publishable key** (تبدأ بـ `pk_test_` أو `pk_live_`) — تُستخدم في الواجهة الأمامية (frontend) إن احتجت.
   - **Secret key** — انقر **Reveal** بجانب "Secret key" وانسخه (يبدأ بـ `sk_test_` أو `sk_live_`).
3. **لا تشارك الـ Secret key** ولا ترفعها إلى Git؛ ضعها فقط في `.env` على السيرفر أو جهازك.

---

## 4. إنشاء المنتجات والأسعار (Plans: Pro و Student)

UniPilot يستخدم خطتين مدفوعة: **Pro** و **Student**. تحتاج لإنشاء منتج (Product) وسعر (Price) لكل خطة.

### 4.1 إنشاء خطة Pro

1. من لوحة Stripe: **Product catalog → Products → Add product**
2. املأ:
   - **Name:** `UniPilot Pro` (أو الاسم الذي تريده)
   - **Description:** (اختياري) مثلاً: استخدام غير محدود للذكاء الاصطناعي
   - **Pricing model:** اختر **Recurring** (اشتراك شهري أو سنوي)
3. في **Pricing**:
   - **Price:** المبلغ (مثلاً 9.99) والعملة (مثلاً USD).
   - **Billing period:** Monthly أو Yearly حسب ما تريد.
4. احفظ المنتج.
5. بعد الحفظ، انقر على السعر الذي أنشأته وانسخ **Price ID** — يبدو مثل: `price_1ABC123...`.  
   هذا هو **STRIPE_PRO_PLAN_PRICE_ID** الذي ستضعه في `.env`.

### 4.2 إنشاء خطة Student

1. مرة أخرى: **Products → Add product**
2. **Name:** مثلاً `UniPilot Student`
3. **Pricing:** اشتراك (Recurring) بمبلغ أقل (مثلاً 4.99) إذا أردت تخفيض للطلاب.
4. احفظ وانسخ **Price ID** لهذا السعر.  
   هذا هو **STRIPE_STUDENT_PLAN_PRICE_ID**.

---

## 5. إعداد Webhook (مهم للاشتراكات)

الويب هوك يسمح لـ Stripe بإبلاغ تطبيقك عند تجديد الاشتراك أو إلغائه أو فشل الدفع.

### 5.1 على السيرفر (Production)

1. من لوحة Stripe: **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:**  
   `https://عنوان-موقعك.com/api/billing/webhook`  
   (استبدل بعنوان تطبيقك الفعلي، مثلاً `https://unipilot.onrender.com/api/billing/webhook`)
3. **Events to send:** اختر على الأقل:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - (اختياري) `invoice.payment_failed`
4. انقر **Add endpoint**.
5. في صفحة الـ Webhook انقر **Reveal** بجانب **Signing secret** وانسخه (يبدأ بـ `whsec_...`).  
   هذا هو **STRIPE_WEBHOOK_SECRET** في `.env`.

### 5.2 للتطوير المحلي (اختياري)

على جهازك لا يستطيع Stripe الوصول إلى `localhost`. يمكنك استخدام **Stripe CLI**:

1. نزّل Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. في الطرفية:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```
3. ستظهر لك **Signing secret** مؤقت (يبدأ بـ `whsec_...`). ضعه في `.env` كـ `STRIPE_WEBHOOK_SECRET` أثناء الاختبار المحلي.

---

## 6. ضبط ملف `.env` في UniPilot

في مجلد المشروع (مثلاً `frontend-vite`) افتح أو أنشئ ملف `.env` وأضف:

```env
# Stripe — استبدل القيم بمفاتيحك و Price IDs
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
STRIPE_PRO_PLAN_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_STUDENT_PLAN_PRICE_ID=price_xxxxxxxxxxxxx
APP_URL=http://localhost:3001
```

- **STRIPE_SECRET_KEY:** المفتاح السري من الخطوة 3.
- **STRIPE_PUBLISHABLE_KEY:** المفتاح العام (إن كان التطبيق يرسله للواجهة).
- **STRIPE_WEBHOOK_SECRET:** من الخطوة 5 (من لوحة Stripe أو من `stripe listen` محلياً).
- **STRIPE_PRO_PLAN_PRICE_ID** و **STRIPE_STUDENT_PLAN_PRICE_ID:** من الخطوة 4.
- **APP_URL:** رابط التطبيق العام الذي يرجع له Stripe بعد الدفع.  
  - محلياً: `http://localhost:3001` (أو الرابط الذي تشغل عليه السيرفر).  
  - على Render: `https://your-service-name.onrender.com`.

احفظ الملف ثم **أعد تشغيل السيرفر** (مثلاً `npm run server` أو إعادة تشغيل العملية على Render).

---

## 7. التحقق من أن الفوترة تعمل

1. شغّل التطبيق وادخل إلى **الإعدادات (Settings) → Plan & Billing**.
2. إذا ظهر زر **"إدارة الاشتراك" (Manage subscription)** وليس رسالة "الفوترة غير مضبوطة"، فمعناه أن السيرفر يرى Stripe بشكل صحيح.
3. ادخل إلى صفحة **Pricing** وجرّب **Upgrade** — يجب أن يوجهك إلى Stripe Checkout.
4. في وضع الاختبار استخدم البطاقة: `4242 4242 4242 4242` وتاريخ مستقبلي ورمز CVC أي رقم (مثلاً 123).

---

## 8. النشر على Render (أو أي مضيف)

1. في لوحة Render (أو مضيفك): **Environment** أو **Environment variables**.
2. أضف نفس المتغيرات كـ **Environment variables** (وليس في ملف في المستودع):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_PLAN_PRICE_ID`
   - `STRIPE_STUDENT_PLAN_PRICE_ID`
3. في Stripe Dashboard → Webhooks، تأكد أن **Endpoint URL** يشير إلى عنوان موقعك المنشور (مثل `https://unipilot.onrender.com/api/billing/webhook`).

---

## 9. ملخص المتغيرات

| المتغير | من أين تحصل عليه |
|---------|-------------------|
| `STRIPE_SECRET_KEY` | Developers → API keys → Secret key |
| `STRIPE_PUBLISHABLE_KEY` | Developers → API keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → Endpoint → Signing secret |
| `STRIPE_PRO_PLAN_PRICE_ID` | Product catalog → منتج Pro → Price ID |
| `STRIPE_STUDENT_PLAN_PRICE_ID` | Product catalog → منتج Student → Price ID |

---

## 10. روابط سريعة

- تسجيل Stripe: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
- API keys: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- المنتجات: [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)
- Webhooks: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- بطاقات اختبار: [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards)

بعد إكمال هذه الخطوات وإعادة تشغيل السيرفر، تصبح الفوترة وإدارة الاشتراك مفعّلة في UniPilot.
