import { useLanguage } from '@/lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const content = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated',
    intro: 'By using UniPilot you agree to these terms. If you do not agree, do not use the service.',
    use: 'Acceptable use',
    useDesc: 'You must use UniPilot only for lawful academic and personal study purposes. You may not abuse the service, attempt to gain unauthorized access, or use it to harm others. We may suspend or terminate accounts that violate these terms.',
    account: 'Account responsibility',
    accountDesc: 'You are responsible for keeping your credentials secure. Notify the administrator of any unauthorized use.',
    service: 'Service availability',
    serviceDesc: 'We strive for reliability but do not guarantee uninterrupted service. Features may change; we will aim to communicate significant changes.',
    liability: 'Limitation of liability',
    liabilityDesc: 'UniPilot is provided "as is". We are not liable for indirect, incidental, or consequential damages arising from your use of the service. Academic decisions remain your responsibility.',
    privacy: 'Privacy',
    privacyDesc: 'Your use is also governed by our Privacy Policy. By using UniPilot you consent to the collection and use of data as described there.',
    contact: 'Contact',
    contactDesc: 'For questions about these terms, contact the application administrator.',
    back: 'Back to Home',
  },
  ar: {
    title: 'شروط الخدمة',
    updated: 'آخر تحديث',
    intro: 'باستخدامك يوني بايلوت فإنك توافق على هذه الشروط. إذا كنت لا توافق، لا تستخدم الخدمة.',
    use: 'الاستخدام المقبول',
    useDesc: 'يجب استخدام يوني بايلوت لأغراض أكاديمية وشخصية قانونية فقط. لا يجوز إساءة استخدام الخدمة أو محاولة الوصول غير المصرح به أو استخدامها للإضرار بالآخرين. قد نعلق الحسابات أو ننهيها عند مخالفة هذه الشروط.',
    account: 'مسؤولية الحساب',
    accountDesc: 'أنت مسؤول عن الحفاظ على أمان بيانات الدخول. أبلغ المسؤول عن أي استخدام غير مصرح به.',
    service: 'توفر الخدمة',
    serviceDesc: 'نسعى لموثوقية الخدمة لكننا لا نضمن عدم انقطاعها. قد تتغير الميزات؛ سنسعى لإبلاغ التغييرات الجوهرية.',
    liability: 'حدود المسؤولية',
    liabilityDesc: 'يوني بايلوت يُقدَّم "كما هو". نحن غير مسؤولين عن الأضرار غير المباشرة أو العرضية أو التبعية الناتجة عن استخدامك للخدمة. القرارات الأكاديمية تبقى مسؤوليتك.',
    privacy: 'الخصوصية',
    privacyDesc: 'استخدامك يخضع أيضاً لسياسة الخصوصية. باستخدامك يوني بايلوت فإنك توافق على جمع واستخدام البيانات كما هو موضح هناك.',
    contact: 'الاتصال',
    contactDesc: 'لأسئلة حول هذه الشروط، تواصل مع مسؤول التطبيق.',
    back: 'العودة للرئيسية',
  },
};

export default function TermsOfService() {
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
            <h3 className="font-semibold text-lg mb-2">{t.use}</h3>
            <p className="text-sm">{t.useDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.account}</h3>
            <p className="text-sm">{t.accountDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.service}</h3>
            <p className="text-sm">{t.serviceDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.liability}</h3>
            <p className="text-sm">{t.liabilityDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.privacy}</h3>
            <p className="text-sm">{t.privacyDesc}</p>
          </section>
          <section>
            <h3 className="font-semibold text-lg mb-2">{t.contact}</h3>
            <p className="text-sm">{t.contactDesc}</p>
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
