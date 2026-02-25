import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sparkles, Bell, Moon, Sun, Globe, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './AppSidebar';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageEntrance } from '@/components/ui/PageEntrance';
import { UserGuideChatbot } from '@/components/UserGuideChatbot';
import { cn } from '@/lib/utils';

const MOBILE_BREAKPOINT = 768;

export function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { api } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const shownNotificationsRef = useRef(new Set());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(() => {
      loadNotifications();
    }, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    } catch {
      // ignore
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.post('/notifications/mark-read', { id });
      setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
    } catch {
      // ignore
    }
  };

  // basic system notifications when new items arrive (Browser Notification API)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    notifications.forEach((n) => {
      if (!n.read_at && !shownNotificationsRef.current.has(n.id)) {
        try {
          new Notification(n.title, { body: n.body });
          shownNotificationsRef.current.add(n.id);
        } catch (_) {}
      }
    });
  }, [notifications]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return t('nav.dashboard');
    if (path.startsWith('/courses')) return t('nav.courses');
    if (path === '/academic-history') return t('nav.academicHistory');
    if (path === '/planner') return t('nav.planner');
    if (path === '/ai-coach') return t('nav.aiConsultant');
    if (path === '/analytics') return t('nav.analytics');
    if (path === '/study-tools') return t('nav.studyTools');
    if (path === '/notes') return t('nav.notes');
    if (path === '/voice-to-text') return t('nav.voiceToText');
    if (path === '/translate-video') return t('nav.translateVideo');
    if (path === '/read-texts') return t('nav.readTexts');
    if (path === '/infographics') return t('nav.infographics');
    if (path === '/theses') return t('nav.theses');
    if (path === '/subject-tree') return t('nav.subjectTree');
    if (path === '/admin') return t('nav.admin');
    if (path === '/admin/notifications') return t('nav.adminNotifications');
    if (path === '/admin-notifications') return t('nav.adminNotifications');
    if (path === '/settings') return t('common.settings');
    return 'UniPilot';
  };

  return (
    <div className="flex h-screen max-h-screen min-h-0 bg-background overflow-hidden">
      {/* Mobile overlay when sidebar open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AppSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-muted/30">
        <header
          className={cn(
            "h-14 sm:h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between shrink-0",
            "px-4 sm:px-6 md:px-8 gap-2 sm:gap-4"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-base sm:text-xl font-bold font-display truncate">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10" onClick={toggleLanguage}>
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative h-9 w-9 sm:h-10 sm:w-10"
                  onClick={loadNotifications}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 sm:top-1 sm:right-1 sm:w-2 sm:h-2 bg-destructive rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80">
                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                  <span className="text-sm font-semibold">{t('notifications.title')}</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                      disabled={notificationsLoading}
                    >
                      {t('notifications.markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {language === 'ar' ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t('notifications.noNotifications')}
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map((n) => {
                        const link = n.link && String(n.link).trim() !== '' ? n.link : null;
                        const sourceToLink = {
                          admin: '/admin-notifications',
                          catalog: '/courses',
                          exam_insight: '/study-tools',
                          app_note_general: '/analytics',
                        };
                        let target = link || sourceToLink[n.source] || null;
                        if (!target && (n.title || n.body)) {
                          const text = `${n.title || ''} ${n.body || ''}`;
                          if (/مادة جديدة|الكتالوج|catalog|new course/i.test(text)) target = '/courses';
                          else if (/تحليل أداء لاختبار|Exam performance insight|اختبار/i.test(text)) target = '/study-tools';
                          else if (/تحليل أدائك|أدائك الأكاديمي|academic/i.test(text)) target = '/analytics';
                        }
                        const content = (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold truncate">{n.title}</span>
                              {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            <span className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
                              {n.body}
                            </span>
                          </>
                        );
                        const className = cn(
                          'block w-full text-left px-3 py-2 text-xs sm:text-sm flex flex-col gap-0.5 rounded-sm',
                          !n.read_at ? 'bg-muted/60 hover:bg-muted' : 'hover:bg-muted/40'
                        );
                        if (target) {
                          return (
                            <Link key={n.id} to={target} onClick={() => markOneRead(n.id)} className={className}>
                              {content}
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markOneRead(n.id)}
                            className={className}
                          >
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="gap-1.5 sm:gap-2 rounded-full border-primary/20 hover:bg-primary/5 transition-all btn-3d hidden sm:flex text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium hidden sm:inline">AI Insights</span>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 custom-scrollbar">
          <PageEntrance pathname={location.pathname} className="max-w-7xl mx-auto w-full">
            {children}
          </PageEntrance>
        </div>
      </main>
      <UserGuideChatbot />
    </div>
  );
}
