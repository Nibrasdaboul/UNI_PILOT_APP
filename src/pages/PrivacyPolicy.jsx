import { useLanguage } from '@/lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const content = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated',
    intro: 'UniPilot ("we", "our") respects your privacy. This policy describes how we collect, use, and protect your data when you use our application.',
    collect: 'Data we collect',
    collectDesc: 'We collect: account data (email, hashed password, full name, role); academic data you enter (courses, grades, planner, notes); usage data necessary to provide the service (e.g. AI chat content you send). Passwords are hashed with bcrypt and never stored in plain text.',
    use: 'How we use data',
    useDesc: 'Your data is used to provide the UniPilot service: dashboard, grades, planner, AI coach, study tools, and notifications. We do not sell your data. AI features may send content to third-party providers (e.g. Groq) under their privacy terms.',
    storage: 'Storage and security',
    storageDesc: 'Data is stored in a PostgreSQL database. We use industry-standard measures: HTTPS, secure authentication (JWT), rate limiting, and security headers. Access is restricted to authorized systems.',
    retention: 'Retention and deletion',
    retentionDesc: 'You can export your data (Settings → Export data) and delete your account (Settings → Delete account) at any time. Account deletion removes your profile and associated data from our systems.',
    cookies: 'Cookies and local storage',
    cookiesDesc: 'We use session storage for your login token (no long-lived cookies). No tracking or advertising cookies are used.',
    contact: 'Contact',
    contactDesc: 'For privacy questions, contact the application administrator. Email: ',
    contactEmail: 'nbrasnwrs673@gmail.com',
    back: 'Back to Home',
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث',
    intro: 'يوني بايلوت ("نحن") يحترم خصوصيتك. تصف هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لبياناتك عند استخدام التطبيق.',
    collect: 'البيانات التي نجمعها',
    collectDesc: 'نجمع: بيانات الحساب (البريد الإلكتروني، كلمة المرور المشفرة، الاسم الكامل، الدور)؛ البيانات الأكاديمية التي تدخلها (المقررات، العلامات، المخطط، الملاحظات)؛ بيانات الاستخدام اللازمة لتقديم الخدمة (مثل محتوى الدردشة المرسل للمستشار الذكي). كلمات المرور مشفرة بـ bcrypt ولا تُخزّن بنص واضح.',
    use: 'كيف نستخدم البيانات',
    useDesc: 'تُستخدم بياناتك لتقديم خدمة يوني بايلوت: لوحة التحكم، العلامات، المخطط، المستشار الذكي، أدوات الدراسة، والإشعارات. لا نبيع بياناتك. قد ترسل ميزات الذكاء الاصطناعي محتوىً إلى مزودين خارجيين (مثل Groq) وفق شروط خصوصيتهم.',
    storage: 'التخزين والأمان',
    storageDesc: 'تُخزَّن البيانات في قاعدة بيانات PostgreSQL. نستخدم إجراءات معيارية: HTTPS، مصادقة آمنة (JWT)، تحديد معدل الطلبات، وهيدرات أمان. الوصول مقيد لأنظمة مصرح لها.',
    retention: 'الاحتفاظ والحذف',
    retentionDesc: 'يمكنك تصدير بياناتك (الإعدادات → تصدير البيانات) وحذف حسابك (الإعدادات → حذف الحساب) في أي وقت. حذف الحساب يزيل ملفك وبياناتك المرتبطة من أنظمتنا.',
    cookies: 'ملفات تعريف الارتباط والتخزين المحلي',
    cookiesDesc: 'نستخدم تخزين الجلسة لرمز تسجيل الدخول (بدون cookies طويلة الأمد). لا نستخدم ملفات تتبع أو إعلانية.',
    contact: 'الاتصال',
    contactDesc: 'لأسئلة الخصوصية، تواصل مع مسؤول التطبيق. البريد الإلكتروني: ',
    contactEmail: 'nbrasnwrs673@gmail.com',
    back: 'العودة للرئيسية',
  },
};

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const t = content[language === 'ar' ? 'ar' : 'en'];
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 max-w-3xl mx-auto">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-display">{t.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.updated}: February 2025</p>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <p>{t.intro}</p>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.collect}</h3>
            <p className="text-sm">{t.collectDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.use}</h3>
            <p className="text-sm">{t.useDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.storage}</h3>
            <p className="text-sm">{t.storageDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.retention}</h3>
            <p className="text-sm">{t.retentionDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.cookies}</h3>
            <p className="text-sm">{t.cookiesDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.contact}</h3>
            <p className="text-sm">
              {t.contactDesc}
              <a href="mailto:nbrasnwrs673@gmail.com" className="text-primary hover:underline font-medium">{t.contactEmail}</a>
            </p>
          </section>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link to="/">{t.back}</Link>
        </Button>
      </div>
    </div>
  );
}
