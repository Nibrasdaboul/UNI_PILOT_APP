import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';

const CONSENT_KEY = 'unipilot_consent_accepted';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const isAr = language === 'ar';
  const text = isAr
    ? 'نستخدم تخزين الجلسة لتسجيل الدخول فقط. لا نستخدم ملفات تتبع أو إعلانية. انظر '
    : 'We use session storage for sign-in only. We do not use tracking or advertising cookies. See ';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-4 shadow-lg"
      role="banner"
      aria-label={isAr ? 'إشعار الخصوصية' : 'Privacy notice'}
    >
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-foreground/90 text-center sm:text-left">
          {text}
          <Link to="/privacy" className="underline font-medium text-primary hover:no-underline">
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </Link>
          .
        </p>
        <Button size="sm" onClick={accept} className="shrink-0">
          {isAr ? 'موافق' : 'Accept'}
        </Button>
      </div>
    </div>
  );
}
