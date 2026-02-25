# UniPilot — PROMPT لفيديو إعلاني بالذكاء الاصطناعي

استخدم أحد الـ PROMPTs أدناه مع أداة توليد فيديو (مثل Runway، Luma، Sora، أو أدوات نص-إلى-فيديو أخرى). في الأسفل إجابة سؤال: **هل تحتاج صوراً من التطبيق؟**

---

## PROMPT واحد (نسخ ولصق — فيديو كامل)

```
Create a 2-minute promotional video for "UniPilot - Your Smart Academic Companion", a web app for students and universities. Style: modern, clean, professional. Mood: inspiring and productive. Resolution: 1080p. Include subtle background music (low volume) and space for voiceover.

SCENE 1 (0:00–0:20): A student at a desk with a laptop and phone, looking stressed. Multiple browser tabs and a messy calendar on screen. Overlay text: "Grades here. Schedule there. No single place to plan." Voiceover line: "Grades in one app, schedule in another. What if one platform did it all?"

SCENE 2 (0:20–0:45): Transition to a clean, modern dashboard interface. Show: courses list, GPA, upcoming tasks. Logo "UniPilot" visible. Clean UI with cards and clear typography. Voiceover: "UniPilot is your smart academic companion. One dashboard for courses, grades, and tasks — in Arabic and English."

SCENE 3 (0:45–1:45): Split or sequence of four short clips: (A) Calendar/planner view with events and tasks. (B) Chat interface with AI conversation. (C) Study tools: flashcards or summary cards. (D) Grade table or chart. Voiceover: "Plan your week. Ask the AI coach anything. Summarize and practice. Track your GPA. All in one place."

SCENE 4 (1:45–2:15): Admin-style screen: user list or course catalog, professional and secure look. Voiceover: "For universities: manage users, courses, and announcements. Secure and scalable."

SCENE 5 (2:15–2:35): UniPilot logo centered, tagline "One platform. Your success." and "Contact us for a demo or license." Clean, minimal, memorable. Voiceover: "UniPilot. One platform. Your success. Contact us for a demo or license."
```

---

## PROMPTs حسب المشهد (لأدوات تنتج مشهداً واحداً في المرة)

**Scene 1 — Hook**
```
Short video clip, 20 seconds: stressed university student at desk with laptop and phone, multiple apps and tabs open, messy calendar on screen. Modern room, natural light. Mood: overwhelmed. Text overlay: "Grades here. Schedule there. No single place." Professional, cinematic.
```

**Scene 2 — Intro**
```
Short video clip, 25 seconds: clean modern app dashboard on a laptop screen. Shows courses list, GPA display, upcoming tasks. Logo "UniPilot" visible. Minimal UI, cards and clear typography. Professional product shot. Inspiring, productive mood.
```

**Scene 3a — Planner**
```
Short clip, 15 seconds: app screen showing a weekly planner or calendar with events and to-do tasks. Clean, organized. Product demo style.
```

**Scene 3b — AI Coach**
```
Short clip, 15 seconds: chat interface on screen, conversation with an AI assistant. Student asking a question, reply visible. Modern messaging UI. Product demo style.
```

**Scene 3c — Study tools**
```
Short clip, 15 seconds: app showing study materials — flashcards or summary cards. Clean, educational look. Product demo style.
```

**Scene 3d — Grades**
```
Short clip, 15 seconds: app screen with grade table or GPA chart. Clean data visualization. Product demo style.
```

**Scene 4 — Institutions**
```
Short clip, 30 seconds: admin panel on screen — user list or course catalog. Professional, secure, institutional look. Slight zoom or subtle motion. Product demo style.
```

**Scene 5 — CTA**
```
Short clip, 20 seconds: centered logo "UniPilot" with tagline "One platform. Your success." and "Contact us for a demo or license." Minimal, dark or gradient background. Memorable, professional outro.
```

---

## هل تحتاج صوراً من التطبيق؟

### الجواب المختصر: **نعم، يُفضّل أن يكون عندك لقطات حقيقية من التطبيق** للمشاهد التي تعرض الواجهة.

| الطريقة | تحتاج صور/لقطات؟ | ملاحظة |
|--------|-------------------|--------|
| **فيديو 100% من الذكاء الاصطناعي (نص → فيديو)** | لا | الأداة ستولّد مشاهد عامة (طالب، لوحة تحكم تخيلية). الواجهة لن تكون واجهة UniPilot الحقيقية — أقل مصداقية لمنتج برمجي. |
| **صورة → فيديو (Image-to-Video)** | **نعم** | ترفع لقطة شاشة من التطبيق والأداة تضيف حركة بسيطة (zoom، pan). النتيجة تعرض التطبيق الحقيقي — أنسب للمشاهد 2، 3، 4. |
| **مونتاج: لقطات تطبيق + مشاهد مولّدة** | **نعم** | أفضل خيار: مشهد الافتتاح والختام من الذكاء الاصطناعي، ومشاهد المنتج من لقطات حقيقية من UniPilot. |

### ما الذي تسجله أو تلتقطه من التطبيق؟

1. **لقطات شاشة (Screenshots) أو فيديو قصير (Screen recording)** للشاشات التالية:
   - **لوحة التحكم (Dashboard)** — المقررات، المعدل، المهام القادمة.
   - **المخطط (Planner)** — عرض يومي أو أسبوعي مع أحداث ومهام.
   - **المستشار الذكي (AI Coach)** — نافذة محادثة مع سؤال وجواب.
   - **أدوات الدراسة (Study Tools)** — ملخصات أو بطاقات أو اختبار.
   - **شاشة المقرر / العلامات** — جدول علامات أو مخطط GPA.
   - **لوحة المسؤول (Admin)** — قائمة مستخدمين أو كتالوج مقررات أو إشعارات.
   - **الشعار والصفحة الرئيسية** — للختام (أو استخدم `public/logo.svg`).

2. **نصائح التقاط:**
   - استخدم **سمة فاتحة** و**دقة عالية (1080p)** حتى تظهر النصوص والواجهة بوضوح.
   - إن أمكن، **تسجيل شاشة قصير (5–15 ثانية)** لكل شاشة مع حركة بسيطة (تمرير، ضغط زر، فتح محادثة) ثم استخدامها كقطع في المونتاج أو كمدخلات لصورة-إلى-فيديو.
   - احفظ اللقطات بأسماء واضحة مثل: `unipilot-dashboard.png`, `unipilot-planner.png`, `unipilot-ai-coach.png`, … لتسهيل المونتاج.

### الخلاصة

- **لا تحتاج صوراً** إذا كنت تريد فيديو كامل من نص فقط (كل المشاهد مولّدة) — لكن الواجهة لن تكون تطبيقك الحقيقي.
- **نعم تحتاج صوراً (أو فيديو لقطات شاشة)** إذا كنت تريد فيديو يعرض UniPilot فعلياً — استخدمها في المشاهد 2، 3، 4 واختيارياً في الختام مع الشعار.

---

**الملف:** `PROMO_VIDEO_AI_PROMPT.md`  
**مرجع السكربت الكامل:** `PROMO_VIDEO_SCRIPT.md`
