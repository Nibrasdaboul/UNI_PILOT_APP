import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';

const included = [
  'Full source code (frontend + backend)',
  'Documentation (Runbook, Admin Guide, Architecture, Backup/Restore, Security)',
  'Support period (30–90 days)',
  'Handover (deployment walkthrough and/or video)',
];

const includedAr = [
  'كود المصدر الكامل (واجهة + خادم)',
  'التوثيق (دليل التشغيل، المسؤول، المعمارية، النسخ الاحتياطي، الأمان)',
  'فترة دعم (30–90 يوماً)',
  'التسليم (جولة نشر و/أو فيديو)',
];

export default function Pricing() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between overflow-visible">
          <Link to="/" className="flex items-center gap-2 overflow-visible">
            <img src="/logo-icon.png" alt="UniPilot" className="h-16 sm:h-32 w-auto object-contain sm:hidden" />
            <img src="/logo-full.png" alt="UniPilot" className="h-28 sm:h-32 w-auto object-contain hidden sm:block" />
          </Link>
          <Link to="/">
            <Button variant="ghost">{isAr ? 'الرئيسية' : 'Home'}</Button>
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-4">
            {isAr ? 'للجامعات والمؤسسات' : 'For Universities & Institutions'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAr ? 'ترخيص لمرة واحدة — يشمل الكود والتوثيق والدعم.' : 'One-time perpetual license — includes code, documentation, and support.'}
          </p>
        </div>

        <div className="border rounded-2xl bg-card p-8 shadow-lg">
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold">$10,000</span>
            <span className="text-muted-foreground">{isAr ? 'USD' : 'USD'}</span>
          </div>
          <ul className="space-y-4 mb-8">
            {(isAr ? includedAr : included).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a href="mailto:nbrasnwrs673@gmail.com">{isAr ? 'تواصل معنا' : 'Contact us'}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/">{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
