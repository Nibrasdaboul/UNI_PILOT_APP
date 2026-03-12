import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Trophy,
  Target,
  Puzzle,
  Loader2,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn, getEventColor, gradeToLetter, getGradeStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user, api } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [creditsDialog, setCreditsDialog] = useState(null); // 'completed' | 'carried' | null
  const [chartData, setChartData] = useState([]);
  const [gamificationMe, setGamificationMe] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [puzzleValidating, setPuzzleValidating] = useState(false);
  const [puzzleResult, setPuzzleResult] = useState(null); // { correct, xp_earned }
  const [showWelcomeReminder, setShowWelcomeReminder] = useState(false);
  const [upcomingTasksList, setUpcomingTasksList] = useState([]);
  const [plannerEventsList, setPlannerEventsList] = useState([]);
  const [dailyChallengeSelectedIndex, setDailyChallengeSelectedIndex] = useState(null);
  const [dailyChallengeValidating, setDailyChallengeValidating] = useState(false);
  const [dailyChallengeResult, setDailyChallengeResult] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [location.pathname]);

  // Show fiery welcome banner once per day when dashboard loads (not dependent on API success)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `unipilot_welcome_shown_${today}`;
    if (!sessionStorage.getItem(key)) {
      setShowWelcomeReminder(true);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, chartRes, meRes, challengeRes, tasksRes, eventsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/chart-data').catch((e) => ({ data: [], _err: e })),
        api.get('/gamification/me').catch((e) => ({ data: null, _err: e })),
        api.get('/gamification/daily-challenge', { params: { lang: language === 'ar' ? 'ar' : 'en' } }).catch((e) => ({ data: null, _err: e })),
        api.get('/tasks/upcoming').catch((e) => ({ data: [] })),
        api.get('/planner/events').catch((e) => ({ data: [] })),
      ]);
      setData(summaryRes.data);
      setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
      setGamificationMe(meRes.data ?? null);
      setDailyChallenge(challengeRes.data ?? null);
      setUpcomingTasksList(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setPlannerEventsList(Array.isArray(eventsRes.data) ? eventsRes.data : []);
    } catch (error) {
      console.error('Dashboard error:', error);
      const msg = error.response?.data?.detail || error.message || t('common.error');
      toast.error(typeof msg === 'string' ? msg : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPuzzle = async () => {
    setPuzzle(null);
    setPuzzleResult(null);
    const lang = language === 'ar' ? 'ar' : 'en';
    try {
      const smartRes = await api.get('/gamification/smart-question', { params: { lang } });
      setPuzzle({ ...smartRes.data, source: 'smart' });
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 503) {
        try {
          const res = await api.get('/gamification/puzzle', { params: { lang } });
          setPuzzle({ ...res.data, source: 'puzzle' });
        } catch (e2) {
          const msg = e2.response?.data?.detail || e2.message;
          toast.error(msg || t('common.error'));
        }
      } else {
        const msg = err.response?.data?.detail || err.message;
        toast.error(msg || t('common.error'));
      }
    }
  };

  const closeWelcomeReminder = () => {
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(`unipilot_welcome_shown_${today}`, '1');
    setShowWelcomeReminder(false);
  };

  const validateDailyChallenge = async () => {
    if (dailyChallenge?.type !== 'daily_question' || dailyChallengeSelectedIndex == null || dailyChallenge.daily_challenge_id == null) return;
    setDailyChallengeValidating(true);
    setDailyChallengeResult(null);
    try {
      const res = await api.post('/gamification/daily-challenge/validate', {
        daily_challenge_id: dailyChallenge.daily_challenge_id,
        selected_index: parseInt(dailyChallengeSelectedIndex, 10),
      });
      setDailyChallengeResult(res.data);
      if (res.data.correct) {
        toast.success(language === 'ar' ? `أحسنت! +${res.data.xp_earned} XP` : `Correct! +${res.data.xp_earned} XP`);
        const meRes = await api.get('/gamification/me').catch(() => null);
        if (meRes?.data) setGamificationMe(meRes.data);
      } else {
        toast.error(language === 'ar' ? 'إجابة خاطئة. جرّب مرة أخرى.' : 'Wrong answer. Try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      toast.error(msg || t('common.error'));
      setDailyChallengeResult({ correct: false });
    } finally {
      setDailyChallengeValidating(false);
    }
  };

  const validatePuzzle = async (selectedValue) => {
    if (!puzzle || selectedValue == null) return;
    if (puzzle.source === 'smart') {
      if (puzzle.session_id == null) return;
      setPuzzleValidating(true);
      setPuzzleResult(null);
      try {
        const res = await api.post('/gamification/smart-question/validate', {
          session_id: puzzle.session_id,
          selected_index: parseInt(selectedValue, 10),
        });
        setPuzzleResult(res.data);
        if (res.data.correct) {
          setGamificationMe((prev) => prev ? { ...prev, xp: res.data.xp } : null);
          toast.success(language === 'ar' ? `أحسنت! +${res.data.xp_earned} XP` : `Correct! +${res.data.xp_earned} XP`);
          setPuzzle(null);
          const meRes = await api.get('/gamification/me').catch(() => null);
          if (meRes?.data) setGamificationMe(meRes.data);
        }
      } catch (err) {
        const msg = err.response?.data?.detail || err.message;
        setPuzzleResult({ correct: false });
        if (msg) toast.error(msg);
      } finally {
        setPuzzleValidating(false);
      }
      return;
    }
    if (puzzle.seed == null) return;
    setPuzzleValidating(true);
    setPuzzleResult(null);
    try {
      const res = await api.post('/gamification/puzzle/validate', { selected_value: selectedValue, seed: puzzle.seed }, { params: { lang: language === 'ar' ? 'ar' : 'en' } });
      setPuzzleResult(res.data);
      if (res.data.correct) {
        setGamificationMe((prev) => prev ? { ...prev, xp: res.data.xp } : null);
        toast.success(language === 'ar' ? `أحسنت! +${res.data.xp_earned} XP` : `Correct! +${res.data.xp_earned} XP`);
        setPuzzle(null);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      setPuzzleResult({ correct: false });
      if (msg) toast.error(msg);
    } finally {
      setPuzzleValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse h-32 rounded-[2rem]" />
        ))}
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12" data-testid="dashboard-page">
      {/* Fiery welcome banner at top (once per session) */}
      {showWelcomeReminder && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const tasksPending = (upcomingTasksList || []).filter((t) => t.status !== 'completed' && (t.due_date || '').slice(0, 10) >= today);
        const eventsUpcoming = (plannerEventsList || []).filter((e) => (e.start_date || '').slice(0, 10) >= today && (e.start_date || '').slice(0, 10) <= in14Days);
        const dateItems = [];
        tasksPending.forEach((t) => {
          const d = (t.due_date || '').slice(0, 10);
          if (d) dateItems.push({ date: d, label: t.title, sub: t.course_name, type: 'task' });
        });
        eventsUpcoming.forEach((e) => {
          const d = (e.start_date || '').slice(0, 10);
          if (d) dateItems.push({ date: d, label: e.title || (e.event_type || 'Event'), sub: e.course_name, type: 'event' });
        });
        dateItems.sort((a, b) => a.date.localeCompare(b.date));
        const uniqueDates = dateItems.slice(0, 15);
        return (
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-orange-900/20 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,200,100,0.3),_transparent_50%)]" />
            <div className="relative p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold font-display flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-amber-100 shrink-0" />
                    {language === 'ar' ? `مرحباً ${firstName} 👋` : `Welcome back, ${firstName} 👋`}
                  </h3>
                  <p className="text-amber-50/95 text-sm leading-relaxed mb-4">
                    {language === 'ar'
                      ? 'أنت على الطريق الصحيح. تذكّر تجربة السؤال الذكي وتحدي اليوم أدناه — أسئلة وتمارين عن موادك مع نقاط XP.'
                      : "You're on the right track. Try the Smart Question and Today's Challenge below — questions and exercises on your courses with XP."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                      <h4 className="font-semibold flex items-center gap-2 mb-1.5 text-amber-100">
                        <Puzzle className="w-4 h-4" />
                        {language === 'ar' ? 'السؤال الذكي + تحدي اليوم' : 'Smart Question + Today\'s Challenge'}
                      </h4>
                      <p className="text-white/90 text-xs">
                        {language === 'ar' ? 'في قسم التحديات أدناه — لا تنسَ هذه الخطوة اليوم.' : 'In the Challenges section below — don\'t skip it today.'}
                      </p>
                    </div>
                    {tasksPending.length > 0 && (
                      <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                        <h4 className="font-semibold flex items-center gap-2 mb-1.5 text-amber-100">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'ar' ? 'مهامك القادمة' : 'Your upcoming tasks'}
                        </h4>
                        <ul className="space-y-1 text-white/90 text-xs">
                          {tasksPending.slice(0, 4).map((t, i) => (
                            <li key={t.id || i} className="flex justify-between gap-2 truncate">
                              <span className="truncate">{t.title}</span>
                              <span className="shrink-0 opacity-90">{(t.due_date || '').slice(0, 10)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {uniqueDates.length > 0 && (
                      <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                        <h4 className="font-semibold flex items-center gap-2 mb-1.5 text-amber-100">
                          <CalendarIcon className="w-4 h-4" />
                          {language === 'ar' ? 'مواعيد مهمة' : 'Important dates'}
                        </h4>
                        <ul className="space-y-1 text-white/90 text-xs">
                          {uniqueDates.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex justify-between gap-2 truncate">
                              <span className="truncate">{item.label}</span>
                              <span className="shrink-0 opacity-90">{item.date}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tasksPending.length === 0 && uniqueDates.length === 0 && (
                      <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm sm:col-span-2">
                        <p className="text-white/90 text-xs">
                          {language === 'ar' ? 'لا مهام أو مواعيد قادمة. اذهب إلى المخطط لإضافة أحداث ومهام.' : 'No upcoming tasks or dates. Go to the Planner to add events and tasks.'}
                        </p>
                        <Link to="/planner">
                          <Button size="sm" variant="secondary" className="mt-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border-0">
                            {language === 'ar' ? 'المخطط' : 'Planner'}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-white hover:bg-white/20 h-8 w-8"
                  onClick={closeWelcomeReminder}
                  aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/20">
                <Link to="/planner">
                  <Button size="sm" variant="secondary" className="rounded-xl bg-white/20 hover:bg-white/30 text-white border-0" onClick={closeWelcomeReminder}>
                    {language === 'ar' ? 'المخطط' : 'Planner'}
                  </Button>
                </Link>
                <Button size="sm" className="rounded-xl bg-white text-orange-600 hover:bg-amber-50" onClick={closeWelcomeReminder}>
                  {language === 'ar' ? 'حسناً، شكراً' : 'OK, thanks'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Welcome Section */}
      <AnimatedSection variant="fadeUp">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              {t('dashboard.welcomeBack')}, {firstName} 👋
            </h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {language === 'ar'
                ? `لديك ${data?.pending_tasks || 0} ${t('dashboard.upcomingItems')}`
                : `You have ${data?.pending_tasks || 0} ${t('dashboard.upcomingItems')}`
              }
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {[
          { title: language === 'ar' ? 'المعدل التراكمي' : 'CGPA', value: (data?.cgpa ?? data?.current_gpa) != null ? Number(data.cgpa ?? data.current_gpa).toFixed(2) : '0.00', trend: (data?.cumulative_percent != null ? (data.cumulative_percent + '%') : '') + (language === 'ar' ? ' نسبة تراكمية' : ' cumulative %'), icon: GraduationCap, color: 'secondary' },
          { title: language === 'ar' ? 'المعدل الفصلي (4)' : 'Semester GPA (4)', value: (data?.semester_gpa ?? data?.current_gpa) != null ? Number(data.semester_gpa ?? data.current_gpa).toFixed(2) : '0.00', trend: (data?.semester_percent != null ? (data.semester_percent + '%') : '') + (language === 'ar' ? ' نسبة الفصل' : ' semester %'), icon: TrendingUp, color: 'primary' },
          { title: language === 'ar' ? 'الساعات المنجزة' : 'Credits completed', value: String(data?.credits_completed ?? 0), trend: language === 'ar' ? 'ناجح' : 'passed', icon: BookOpen, color: 'accent', dialogKey: 'completed' },
          { title: language === 'ar' ? 'الساعات المحمولة' : 'Credits carried', value: String(data?.credits_carried ?? 0), trend: language === 'ar' ? 'راسب' : 'failed', icon: AlertCircle, color: 'primary', dialogKey: 'carried' },
          { title: language === 'ar' ? 'الساعات الحالية' : 'Current credits', value: String(data?.credits_current ?? 0), trend: language === 'ar' ? 'هذا الفصل' : 'this semester', icon: Clock, color: 'primary' },
        ].map((s, i) => (
          <AnimatedSection key={i} variant="fadeUp" delay={i + 1}>
            <div
              className={s.dialogKey ? 'cursor-pointer' : ''}
              onClick={s.dialogKey ? () => setCreditsDialog(s.dialogKey) : undefined}
              onKeyDown={s.dialogKey ? (e) => e.key === 'Enter' && setCreditsDialog(s.dialogKey) : undefined}
              role={s.dialogKey ? 'button' : undefined}
              tabIndex={s.dialogKey ? 0 : undefined}
            >
              <StatsCard title={s.title} value={s.value} trend={s.trend} icon={s.icon} color={s.color} />
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Dialog: completed or carried courses list */}
      <Dialog open={!!creditsDialog} onOpenChange={(open) => !open && setCreditsDialog(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {creditsDialog === 'completed'
                ? (language === 'ar' ? 'المواد المنجزة (ناجح)' : 'Completed courses (passed)')
                : (language === 'ar' ? 'المواد المحمولة (راسب)' : 'Carried courses (failed)')}
            </DialogTitle>
            <DialogDescription>
              {creditsDialog === 'completed'
                ? (language === 'ar' ? 'المواد التي أنهيتها بنجاح — الاسم، المعدل من 4، النسبة، التقدير' : 'Courses you passed — name, GPA (4), %, letter grade')
                : (language === 'ar' ? 'المواد التي رسبت فيها — الاسم، المعدل من 4، النسبة، التقدير' : 'Courses you failed — name, GPA (4), %, letter grade')}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-2">
            {creditsDialog === 'completed' && (data?.completed_courses?.length ? data.completed_courses.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border bg-muted/30">
                <span className="font-medium truncate">{c.course_name}</span>
                <span className="shrink-0 text-sm">
                  {c.gpa_points != null ? Number(c.gpa_points).toFixed(2) : '—'} / 4 · {c.percent != null ? Number(c.percent).toFixed(0) : '—'}% · {c.letter_grade ?? '—'}
                </span>
              </div>
            )) : (language === 'ar' ? 'لا توجد مواد منجزة.' : 'No completed courses.'))}
            {creditsDialog === 'carried' && (data?.carried_courses?.length ? data.carried_courses.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border bg-muted/30">
                <span className="font-medium truncate">{c.course_name}</span>
                <span className="shrink-0 text-sm">
                  {c.gpa_points != null ? Number(c.gpa_points).toFixed(2) : '—'} / 4 · {c.percent != null ? Number(c.percent).toFixed(0) : '—'}% · {c.letter_grade ?? '—'}
                </span>
              </div>
            )) : (language === 'ar' ? 'لا توجد مواد محمولة.' : 'No carried courses.'))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Semester charts: GPA & credits */}
      {chartData.length > 0 && (
        <AnimatedSection variant="fadeUp">
          <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl font-display">
                {language === 'ar' ? 'المعدل والساعات عبر الفصول' : 'GPA & credits by semester'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'رسم بياني لأدائك عبر الفصول الدراسية' : 'Your progress across semesters'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === 'ar' ? 'المعدل (4)' : 'GPA (4)'}</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="semester_name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [Number(v).toFixed(2), '']} />
                      <Bar dataKey="gpa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="GPA" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === 'ar' ? 'الساعات المنجزة' : 'Credits completed'}</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="semester_name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="credits" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 4 }} name={language === 'ar' ? 'ساعات' : 'Credits'} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Gamification: XP, daily challenge, puzzle */}
      <AnimatedSection variant="fadeUp">
        <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/10">
          <CardHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-display">
                  {language === 'ar' ? 'التحديات والنقاط' : 'Challenges & XP'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'ارفع مستواك عبر التحديات اليومية والألغاز' : 'Level up with daily challenges and course puzzles'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:px-8 pb-8 space-y-6">
            {gamificationMe != null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {language === 'ar' ? 'المستوى' : 'Level'} {gamificationMe.level}
                  </span>
                  <span className="font-bold text-primary">{gamificationMe.xp} XP</span>
                </div>
                <Progress
                  value={gamificationMe.xp_per_level ? Math.min(100, (gamificationMe.xp % gamificationMe.xp_per_level) / gamificationMe.xp_per_level * 100) : 0}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {gamificationMe.xp_for_next ?? 0} XP {language === 'ar' ? 'لل level القادم' : 'to next level'}
                  {gamificationMe.streak > 0 && ` · ${language === 'ar' ? 'سلسلة' : 'Streak'}: ${gamificationMe.streak} 🔥`}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's challenge — hard question/equation/exercise (course-specific) */}
              <div className="relative p-5 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/2" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h5 className="font-bold flex items-center gap-2 text-base">
                      <Target className="w-5 h-5 text-primary shrink-0" />
                      {language === 'ar' ? 'تحدي اليوم' : "Today's challenge"}
                    </h5>
                    {gamificationMe?.streak > 0 && (
                      <Badge variant="default" className="rounded-full bg-primary/90 text-xs">
                        🔥 {gamificationMe.streak} {language === 'ar' ? 'أيام متتالية' : 'day streak'}
                      </Badge>
                    )}
                  </div>
                  {dailyChallenge?.type === 'daily_question' ? (
                    <>
                      {dailyChallenge.course_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {language === 'ar' ? 'مادة اليوم' : 'Course of the day'}
                          </span>
                          <Badge variant="secondary" className="rounded-lg font-medium text-foreground">
                            <BookOpen className="w-3.5 h-3.5 me-1 rtl:ms-1 rtl:me-0" />
                            {dailyChallenge.course_name}
                          </Badge>
                        </div>
                      )}
                      <p className="text-xs font-bold text-primary">
                        +{dailyChallenge.xp ?? 100} XP {language === 'ar' ? '— سؤال أو تمرين أصعب من السؤال الذكي' : '— harder question or exercise'}
                      </p>
                      {gamificationMe?.daily_completed ? (
                        <Badge variant="default" className="rounded-full bg-green-600 hover:bg-green-600">
                          ✓ {language === 'ar' ? 'مكتمل' : 'Completed'}
                        </Badge>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground leading-relaxed">{dailyChallenge.question}</p>
                          <div className="flex flex-col gap-2">
                            {(dailyChallenge.options || []).map((opt) => (
                              <Button
                                key={opt.value}
                                type="button"
                                variant={dailyChallengeSelectedIndex === opt.value ? 'default' : 'outline'}
                                className="justify-start rounded-xl text-left h-auto py-2.5"
                                disabled={dailyChallengeValidating}
                                onClick={() => setDailyChallengeSelectedIndex(opt.value)}
                              >
                                <span className="truncate">{opt.label}</span>
                              </Button>
                            ))}
                          </div>
                          {dailyChallengeResult && !dailyChallengeResult.correct && (
                            <p className="text-sm text-destructive">
                              {language === 'ar' ? 'إجابة خاطئة. اختر خياراً آخر وحاول مرة أخرى.' : 'Wrong. Pick another option and try again.'}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="rounded-xl"
                            disabled={dailyChallengeSelectedIndex == null || dailyChallengeValidating}
                            onClick={validateDailyChallenge}
                          >
                            {dailyChallengeValidating ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                            {language === 'ar' ? 'تحقق' : 'Check answer'}
                          </Button>
                        </>
                      )}
                      {gamificationMe?.daily_completed && (
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'عد غداً لتحدٍ جديد.' : 'Come back tomorrow for a new challenge.'}
                        </p>
                      )}
                    </>
                  ) : dailyChallenge ? (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'أضف مواد الفصل الحالي لعرض تحدي اليوم، أو تأكد من تفعيل الذكاء الاصطناعي.' : 'Add current semester courses for today\'s challenge, or ensure AI is enabled.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Smart question: AI-generated from student's courses + study content */}
              <div className="p-4 rounded-2xl border bg-card/50 space-y-3">
                <h5 className="font-bold flex items-center gap-2">
                  <Puzzle className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'سؤال ذكي (بالذكاء الاصطناعي)' : 'Smart question (AI)'}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'أسئلة عن موادك من ملخصاتك وبطاقاتك وخرائطك الذهنية' : 'Questions about your courses from your summaries, flashcards & mind maps'}
                </p>
                {puzzle?.type === 'none' && (
                  <p className="text-sm text-muted-foreground">{puzzle.message}</p>
                )}
                {puzzle?.type === 'mc' && (
                  <>
                    {puzzle.course_name && (
                      <p className="text-xs font-semibold text-primary">
                        {language === 'ar' ? 'المادة:' : 'Course:'} {puzzle.course_name}
                      </p>
                    )}
                    <p className="text-sm font-medium text-foreground">{puzzle.question}</p>
                    <div className="flex flex-col gap-2">
                      {(puzzle.options || []).map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant="outline"
                          className="justify-start rounded-xl text-left h-auto py-2.5"
                          disabled={puzzleValidating}
                          onClick={() => validatePuzzle(opt.value)}
                        >
                          {puzzleValidating ? <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" /> : null}
                          <span className="truncate">{opt.label}</span>
                        </Button>
                      ))}
                    </div>
                    {puzzleResult && !puzzleResult.correct && (
                      <p className="text-sm text-destructive">{language === 'ar' ? 'خطأ. جرّب سؤالاً آخر' : 'Wrong. Try another question'}</p>
                    )}
                  </>
                )}
                {!puzzle && (
                  <Button size="sm" variant="outline" onClick={fetchPuzzle} className="rounded-xl">
                    {language === 'ar' ? 'احصل على سؤال' : 'Get a question'}
                  </Button>
                )}
                {puzzle?.type === 'mc' && !puzzleResult?.correct && (
                  <Button size="sm" variant="ghost" onClick={fetchPuzzle} disabled={puzzleValidating} className="text-muted-foreground rounded-xl">
                    {language === 'ar' ? 'سؤال آخر' : 'Another question'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Upcoming Tasks */}
        <AnimatedSection variant="slideRight" className="lg:col-span-2">
        <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b bg-muted/20 px-4 sm:px-6 md:px-8 py-4 sm:py-6 min-w-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-display">{t('dashboard.academicTimeline')}</CardTitle>
              <CardDescription>{language === 'ar' ? 'المحاضرات والاختبارات والمواعيد القادمة' : 'Upcoming lectures, quizzes, and deadlines'}</CardDescription>
            </div>
            <Link to="/planner">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full font-medium">
                {t('dashboard.viewCalendar')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.upcoming_tasks?.length ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-medium">{t('dashboard.noClear')}</p>
                  <p className="text-muted-foreground">{t('dashboard.noEvents')}</p>
                </div>
                <Link to="/planner">
                  <Button variant="outline" className="rounded-full px-6">{t('dashboard.addEvent')}</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {data.upcoming_tasks.map((task) => (
                  <div key={task.id} className="group hover:bg-muted/30 transition-all px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        getEventColor(task.task_type)
                      )}>
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-foreground truncate">{task.title}</h4>
                          <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold tracking-wider px-2 py-0 shrink-0">
                            {task.task_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                          {task.course_id ? 'Course Task' : 'General Task'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {new Date(task.due_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {task.estimated_hours}h {language === 'ar' ? 'المقدرة' : 'estimated'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedSection>

        {/* AI Advisor Card */}
        <AnimatedSection variant="slideLeft">
        <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
          <CardHeader className="px-8 pt-8 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-display">{t('dashboard.aiAdvisor')}</CardTitle>
            <CardDescription>{language === 'ar' ? 'استراتيجية أكاديمية ذكية ورؤى' : 'Intelligent academic strategy and insights'}</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6 flex-1 flex flex-col">
            {(() => {
              const currentCourses = (data?.courses || []).filter((c) => c.current_grade != null && c.finalized_at == null);
              const focusCourse = currentCourses.length
                ? currentCourses.reduce((acc, c) => (Number(c.current_grade) < Number(acc?.current_grade ?? 100) ? c : acc), currentCourses[0])
                : null;
              return focusCourse ? (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                  <h5 className="font-bold text-primary text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {language === 'ar' ? 'ركز هنا لتحسين معدلك' : 'Focus here to improve your GPA'}
                  </h5>
                  <p className="text-sm text-foreground">
                    {language === 'ar'
                      ? `${focusCourse.course_name} — درجتك الحالية ${Number(focusCourse.current_grade).toFixed(0)}%`
                      : `${focusCourse.course_name} — current grade ${Number(focusCourse.current_grade).toFixed(0)}%`}
                  </p>
                  <Link to={`/courses/${focusCourse.id}`}>
                    <Button size="sm" variant="ghost" className="text-primary p-0 h-auto hover:bg-transparent font-bold">
                      {language === 'ar' ? 'افتح المادة' : 'Open course'} <ArrowUpRight className="ml-1 w-4 h-4 rtl:mr-1 rtl:ml-0" />
                    </Button>
                  </Link>
                </div>
              ) : null;
            })()}
            <div className="p-5 rounded-2xl bg-background/50 border border-primary/10 space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle className="w-10 h-10 text-primary" />
              </div>
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {t('dashboard.strategicWarning')}
              </h5>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {language === 'ar' 
                  ? 'راجع درجاتك الحالية وركز على المواد ذات الأولوية العالية لتحسين أدائك.'
                  : 'Review your current grades and focus on high-priority subjects to improve your performance.'
                }
              </p>
              <Link to="/ai-coach">
                <Button size="sm" variant="ghost" className="text-primary p-0 h-auto hover:bg-transparent font-bold">
                  {t('dashboard.generatePlan')} <ArrowUpRight className="ml-1 w-4 h-4 rtl:mr-1 rtl:ml-0" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('dashboard.syllabusProgress')}</span>
                  <span className="font-bold text-primary">{data?.avg_progress?.toFixed(0) || 0}%</span>
                </div>
                <Progress value={data?.avg_progress || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t('dashboard.predictedGrade')}</span>
                  <span className="font-bold text-secondary">{gradeToLetter(data?.avg_progress || 75)}</span>
                </div>
                <Progress value={data?.avg_progress || 75} className="h-2" />
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-primary/10">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                {language === 'ar'
                  ? '"التحسينات اليومية الصغيرة هي مفتاح النتائج الطويلة المدهشة."'
                  : '"Small daily improvements are the key to staggering long-term results."'
                }
              </p>
            </div>
          </CardContent>
        </Card>
        </AnimatedSection>
      </div>

      {/* Courses Overview */}
      {data?.courses?.length > 0 && (
        <AnimatedSection variant="fadeUp">
        <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl font-display">{t('nav.courses')}</CardTitle>
                <CardDescription>{language === 'ar' ? 'تقدم المواد الحالية' : 'Current courses progress'}</CardDescription>
              </div>
              <Link to="/courses">
                <Button variant="ghost" className="rounded-full text-primary hover:bg-primary/10">
                  {t('common.viewAll')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.courses.slice(0, 3).map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`}>
                  <Card className="rounded-2xl border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                            {course.course_code || 'N/A'}
                          </Badge>
                          {course.grade_status && (
                            <Badge className={cn('rounded-full text-[10px]', getGradeStatusColor(course.grade_status))}>
                              {language === 'ar'
                                ? (course.grade_status === 'safe' ? 'آمن' : course.grade_status === 'normal' ? 'وضع عادي' : course.grade_status === 'at_risk' ? 'خطر' : 'خطر عالي')
                                : course.grade_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-bold mb-2 group-hover:text-primary transition-colors">{course.course_name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('courses.currentGrade')}</span>
                          <span className="font-bold">{course.current_grade != null ? Number(course.current_grade).toFixed(1) + '%' : 'N/A'}</span>
                        </div>
                        <Progress value={course.current_grade ?? course.progress ?? 0} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        </AnimatedSection>
      )}
    </div>
  );
}

function StatsCard({ title, value, trend, icon: Icon, color }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent'
  };

  return (
    <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-bold font-display">{value}</h3>
          <p className="text-xs font-semibold text-muted-foreground pt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-primary" />
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
