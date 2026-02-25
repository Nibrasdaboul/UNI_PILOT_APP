# UniPilot — دليل تحسين محرّكات البحث (SEO)

## ما تم إضافته

### 1. **index.html**
- **Meta أساسية:** `description`, `keywords`, `author`, `robots` (index, follow), `theme-color`
- **Open Graph:** `og:type`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:locale`, `og:locale:alternate` (عربي)
- **Twitter Card:** `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Canonical:** يُحدَّث ديناميكياً حسب المسار و`VITE_APP_URL` أو أصل الموقع
- **JSON-LD:** `WebSite` و`Organization` لـ Google (فهم أفضل للموقع)

### 2. **عنوان ووصف لكل صفحة**
- مكوّن **PageSEO** يغيّر `document.title` و`meta name="description"` و`link rel="canonical"` عند تغيير المسار
- الإعدادات معرّفة في `src/lib/routeSEO.js` (عنوان ووصف بالعربي/إنجليزي حسب اللغة)

### 3. **robots.txt**
- موجود في `public/robots.txt`
- يسمح لجميع المحرّكات بالفهرسة ويشير إلى `Sitemap: /sitemap.xml`

### 4. **sitemap.xml**
- **في التطوير:** نسخة في `public/sitemap.xml` تحتوي على `BASE_URL` (للاستبدال يدوياً إن لزم)
- **عند البناء (npm run build):** يُنشأ ملف `dist/sitemap.xml` تلقائياً بعناوين مطلقة باستخدام:
  - `VITE_APP_URL` أو
  - `VITE_BACKEND_URL` أو
  - القيمة الافتراضية `https://unipilot.onrender.com`
- الصفحات المدرجة: `/`, `/pricing`, `/privacy`, `/terms`

### 5. **متغير بيئة اختياري**
- **VITE_APP_URL:** عنوان الموقع العام (للمشاركة والـ canonical). إن لم يُضبَط يُستخدم `VITE_BACKEND_URL` عند البناء.

---

## خطوات بعد النشر (Google Search Console)

1. سجّل الموقع في [Google Search Console](https://search.google.com/search-console).
2. أضف خاصية (Property) بالرابط الكامل لموقعك (مثل `https://unipilot.onrender.com`).
3. قدّم **Sitemap:** `https://YOUR-DOMAIN/sitemap.xml`.
4. (اختياري) اطلب فهرسة الصفحة الرئيسية من أداة "فحص العنوان".

---

## صورة Open Graph (اختياري)

- حالياً يُستخدم `/logo.svg` كصورة افتراضية لـ `og:image` و`twitter:image`.
- لنتيجة أفضل في المشاركة (فيسبوك، تويتر، واتساب): أضف صورة **1200×630** بكسل في المسار `/public/og-image.png` ثم حدّث في `index.html`:
  - `og:image` و`twitter:image` إلى `/og-image.png`.

---

## ملخص الملفات المعدّلة/المضافة

| الملف | الغرض |
|-------|--------|
| `index.html` | Meta كاملة، OG، Twitter، JSON-LD |
| `src/lib/routeSEO.js` | إعداد عنوان ووصف لكل مسار |
| `src/components/PageSEO.jsx` | تحديث العنوان والوصف والـ canonical عند تغيير الصفحة |
| `src/App.jsx` | استدعاء مكوّن PageSEO |
| `public/robots.txt` | توجيه المحرّكات والـ Sitemap |
| `public/sitemap.xml` | قالب Sitemap (للتطوير) |
| `vite.config.js` | مكوّن بناء يكتب `dist/sitemap.xml` بعنوان الموقع عند البناء |
| `.env.example` | توثيق VITE_APP_URL |
