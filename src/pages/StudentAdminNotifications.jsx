import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function StudentAdminNotifications() {
  const { api } = useAuth();
  const { language } = useLanguage();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/notifications/admin');
        if (!cancelled) setList(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [api]);

  const title = language === 'ar' ? 'اشعارات المسؤول' : 'Admin Notifications';
  const emptyLabel = language === 'ar' ? 'لا توجد إشعارات من المسؤول.' : 'No notifications from the admin yet.';
  const dateLabel = language === 'ar' ? 'التاريخ' : 'Date';

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-display">
            <Bell className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">{emptyLabel}</p>
          ) : (
            <div className="space-y-4">
              {list.map((n) => (
                <div
                  key={n.id}
                  className={n.read_at ? 'rounded-lg border bg-card p-4' : 'rounded-lg border bg-primary/5 border-primary/20 p-4'}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-semibold">{n.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={n.type === 'warning' ? 'destructive' : n.type === 'success' ? 'default' : 'secondary'}>
                        {n.type}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {n.created_at ? new Date(n.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
