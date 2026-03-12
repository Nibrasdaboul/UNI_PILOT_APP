import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Check, GraduationCap, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const planFeatures = {
  free: {
    en: ['50 AI actions per month', 'Summaries, flashcards, quizzes', 'Study tools & planner', 'GPA tracking'],
    ar: ['50 عملية ذكاء اصطناعي شهرياً', 'ملخصات، بطاقات، اختبارات', 'أدوات الدراسة والمخطط', 'تتبع المعدل'],
  },
  pro: {
    en: ['Unlimited AI usage', 'All Free features', 'Priority support', 'Export & analytics'],
    ar: ['استخدام غير محدود للذكاء الاصطناعي', 'كل ميزات المجاني', 'دعم أولوية', 'تصدير وتحليلات'],
  },
  student: {
    en: ['Unlimited AI (student discount)', 'All Pro features', 'Student verification', 'Same as Pro'],
    ar: ['ذكاء اصطناعي غير محدود (خصم طالب)', 'كل ميزات برو', 'التحقق الطلابي', 'مثل برو'],
  },
};

export default function Pricing() {
  const { language } = useLanguage();
  const { api, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [plans, setPlans] = useState([]);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPlans() {
      try {
        const res = await api.get('/billing/plans');
        if (!cancelled && res.data) {
          setPlans(res.data.plans || []);
          setBillingConfigured(!!res.data.billing_configured);
        }
      } catch (_) {
        if (!cancelled) setBillingConfigured(false);
      }
      if (!cancelled) setLoading(false);
    }
    fetchPlans();
    return () => { cancelled = true; };
  }, [api]);

  const handleUpgrade = async (planId, priceId) => {
    if (!isAuthenticated) {
      navigate('/');
      toast.info(isAr ? 'سجّل الدخول أولاً للترقية' : 'Sign in first to upgrade');
      return;
    }
    if (!billingConfigured) {
      toast.error(
        isAr
          ? 'الدفع غير مفعّل على السيرفر. تحقق من ملف .env: STRIPE_SECRET_KEY، STRIPE_WEBHOOK_SECRET، ومعرّفات الخطط (price_ أو prod_).'
          : 'Billing is not configured on the server. Check .env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and plan IDs (price_ or prod_).'
      );
      return;
    }
    if (!priceId) {
      toast.error(isAr ? 'معرّف الخطة غير مضبوط في Stripe.' : 'This plan is not configured in Stripe yet.');
      return;
    }
    setCheckoutLoading(planId);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await api.post('/billing/checkout', {
        plan_id: planId,
        price_id: priceId,
        success_url: `${origin}/settings?subscription=success`,
        cancel_url: `${origin}/pricing`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      toast.error(isAr ? 'لم يتم إنشاء رابط الدفع' : 'Checkout link could not be created');
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message;
      if (e?.response?.status === 402) {
        toast.error(isAr ? 'حد الاستخدام متجاوز. ترقية مطلوبة.' : 'Usage limit exceeded. Upgrade required.');
      } else {
        const msg = String(detail || '').toLowerCase().includes('not configured')
          ? (isAr ? 'Stripe غير مضبوط بالكامل على السيرفر (المفاتيح/الويب هوك/الأسعار).' : 'Stripe is not fully configured on the server (keys/webhook/prices).')
          : (detail || (isAr ? 'فشل الدفع' : 'Checkout failed'));
        toast.error(msg);
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getPriceId = (id) => {
    const p = plans.find((x) => x.id === id);
    return p?.price_id || null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between overflow-visible">
          <Link to="/" className="flex items-center gap-2 overflow-visible">
            <img src="/logo-icon.png" alt="UniPilot" className="h-16 sm:h-32 w-auto object-contain sm:hidden" />
            <img src="/logo-full.png" alt="UniPilot" className="h-28 sm:h-32 w-auto object-contain hidden sm:block" />
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link to="/dashboard">
                <Button variant="ghost">{isAr ? 'لوحة التحكم' : 'Dashboard'}</Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="ghost">{isAr ? 'الرئيسية' : 'Home'}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-4">
            {isAr ? 'خطط UniPilot' : 'UniPilot Plans'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAr ? 'اختر الخطة المناسبة لك. مجاني للبدء، برو للاستخدام غير المحدود.' : 'Choose the plan that fits you. Free to start, Pro for unlimited AI.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="border rounded-2xl bg-card p-6 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">{isAr ? 'مجاني' : 'Free'}</h2>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground text-sm">{isAr ? 'شهرياً' : '/month'}</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {(isAr ? planFeatures.free.ar : planFeatures.free.en).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link to={isAuthenticated ? '/dashboard' : '/'}>{isAr ? 'ابدأ مجاناً' : 'Get started free'}</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="border-2 border-primary rounded-2xl bg-card p-6 shadow-lg flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {isAr ? 'الأكثر شعبية' : 'Popular'}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{isAr ? 'برو' : 'Pro'}</h2>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">$9</span>
              <span className="text-muted-foreground text-sm">{isAr ? 'شهرياً' : '/month'}</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {(isAr ? planFeatures.pro.ar : planFeatures.pro.en).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-xl"
              disabled={!!checkoutLoading}
              onClick={() => handleUpgrade('pro', getPriceId('pro'))}
            >
              {checkoutLoading === 'pro' ? (isAr ? 'جاري التحويل...' : 'Redirecting...') : (isAr ? 'ترقية إلى برو' : 'Upgrade to Pro')}
            </Button>
          </div>

          {/* Student */}
          <div className="border rounded-2xl bg-card p-6 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">{isAr ? 'طالب' : 'Student'}</h2>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">$4</span>
              <span className="text-muted-foreground text-sm">{isAr ? 'شهرياً' : '/month'}</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {(isAr ? planFeatures.student.ar : planFeatures.student.en).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="w-full rounded-xl"
              disabled={!!checkoutLoading}
              onClick={() => handleUpgrade('student', getPriceId('student'))}
            >
              {checkoutLoading === 'student' ? (isAr ? 'جاري التحويل...' : 'Redirecting...') : (isAr ? 'ترقية طالب' : 'Upgrade Student')}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {isAr ? 'الأسعار قد تختلف. إلغاء في أي وقت من إعدادات الحساب.' : 'Prices may vary. Cancel anytime from account settings.'}
        </p>
        {!loading && !billingConfigured && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-4">
            {isAr
              ? 'الدفع غير مفعّل: أضف مفاتيح Stripe ومعرّف الويب هوك ومعرّفات الخطط في .env على السيرفر ثم أعد تشغيله.'
              : 'Billing not configured: add Stripe keys, webhook secret, and plan IDs in server .env and restart.'}
          </p>
        )}
      </section>
    </div>
  );
}
