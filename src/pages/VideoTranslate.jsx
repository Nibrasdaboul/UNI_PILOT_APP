import { useLanguage } from '@/lib/LanguageContext';

export default function VideoTranslate() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12"
      data-testid="video-translate-page"
    >
      {/* Logo text only */}
      <div className="flex flex-col items-center gap-4">
        <img src="/logo-text.png" alt="UniPilot" className="h-20 w-auto sm:h-28 md:h-32 object-contain shrink-0" />
      </div>
      {/* Coming soon text – centered, with transparency */}
      <p className="mt-8 text-2xl sm:text-3xl font-semibold text-foreground/80 text-center" dir="auto">
        {isArabic ? 'سيأتي قريباً' : 'Coming soon'}
      </p>
      <p className="mt-2 text-base sm:text-lg text-muted-foreground/80 text-center" dir="ltr">
        {isArabic ? 'Coming soon' : 'سيأتي قريباً'}
      </p>
    </div>
  );
}
