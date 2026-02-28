import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminNotifications() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/admin/notification-broadcasts');
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
  const backLabel = language === 'ar' ? 'العودة للوحة الإدارة' : 'Back to Admin Panel';
  const emptyLabel = language === 'ar' ? 'لم ترسل أي إشعارات بعد.' : 'You have not sent any notifications yet.';
  const dateLabel = language === 'ar' ? 'التاريخ' : 'Date';
  const typeLabel = language === 'ar' ? 'النوع' : 'Type';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead className="max-w-[200px] hidden sm:table-cell">
                    {language === 'ar' ? 'المحتوى' : 'Body'}
                  </TableHead>
                  <TableHead>{typeLabel}</TableHead>
                  <TableHead>{dateLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate hidden sm:table-cell text-muted-foreground">
                      {row.body}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.type === 'warning' ? 'destructive' : row.type === 'success' ? 'default' : 'secondary'}>
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.created_at ? new Date(row.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
