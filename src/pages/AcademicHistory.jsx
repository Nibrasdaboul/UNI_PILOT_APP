import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Star, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const APP_RATINGS = [
  { value: 'excellent', en: 'Excellent', ar: 'ممتاز' },
  { value: 'good', en: 'Good', ar: 'جيد' },
  { value: 'acceptable', en: 'Acceptable', ar: 'مقبول' },
  { value: 'poor', en: 'Poor', ar: 'ضعيف' },
];

export default function AcademicHistory() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const [semesters, setSemesters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCurrent, setFormCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const isArabic = language === 'ar';

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedId) fetchSummary(selectedId);
    else setSummary(null);
  }, [selectedId]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const [semRes, coursesRes] = await Promise.all([
        api.get('/student/semesters'),
        api.get('/student/courses').catch(() => ({ data: [] })),
      ]);
      setSemesters(Array.isArray(semRes.data) ? semRes.data : []);
      setAllCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      if (semRes.data?.length && !selectedId) setSelectedId(semRes.data[0].id);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load semesters');
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (id) => {
    try {
      const res = await api.get(`/student/semesters/${id}`);
      setSummary(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load semester');
      setSummary(null);
    }
  };

  const handleAddSemester = async () => {
    const name = formName.trim() || (isArabic ? 'فصل جديد' : 'New semester');
    try {
      setSaving(true);
      await api.post('/student/semesters', { name, is_current: formCurrent });
      toast.success(isArabic ? 'تمت إضافة الفصل' : 'Semester added');
      setDialogOpen(false);
      setFormName('');
      setFormCurrent(false);
      fetchSemesters();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.post(`/student/semesters/${id}/set-current`);
      toast.success(isArabic ? 'تم تعيين الفصل الحالي' : 'Set as current');
      fetchSemesters();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(isArabic ? 'حذف هذا الفصل؟ (المواد ستبقى بدون فصل)' : 'Delete this semester? (Courses will stay without semester)')) return;
    try {
      await api.delete(`/student/semesters/${id}`);
      toast.success(isArabic ? 'تم الحذف' : 'Deleted');
      if (selectedId === id) setSelectedId(semesters.find((s) => s.id !== id)?.id || null);
      fetchSemesters();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  const ratingLabel = (value) => {
    if (!value) return '—';
    const r = APP_RATINGS.find((x) => x.value === value);
    return r ? (isArabic ? r.ar : r.en) : value;
  };

  const unassignedCourses = allCourses.filter((c) => c.semester_id == null);
  const assignCourseToSemester = async () => {
    if (!assignCourseId || !selectedId) return;
    try {
      setAssigning(true);
      await api.patch(`/student/courses/${assignCourseId}`, { semester_id: selectedId });
      toast.success(isArabic ? 'تم تعيين المادة للفصل' : 'Course assigned to semester');
      setAssignCourseId('');
      fetchSemesters();
      fetchSummary(selectedId);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally {
      setAssigning(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await api.get('/ai/next-semester-suggestions');
      setSuggestions(Array.isArray(res.data?.suggestions) ? res.data.suggestions : []);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="academic-history-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold font-display">{t('academicHistory.title')}</h2>
        <Button onClick={() => { setDialogOpen(true); setFormName(''); setFormCurrent(false); }}>
          <Plus className="w-4 h-4 mr-2" />
          {t('academicHistory.addSemester')}
        </Button>
      </div>

      {semesters.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">{t('academicHistory.noSemesters')}</p>
            <div className="flex justify-center">
              <Button onClick={() => { setDialogOpen(true); setFormName(isArabic ? 'السنة الأولى الفصل الأول 2022/2023' : 'Year 1 Semester 1 2022/2023'); setFormCurrent(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('academicHistory.addSemester')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Label className="shrink-0">{t('academicHistory.selectSemester')}:</Label>
            <Select value={selectedId != null ? String(selectedId) : ''} onValueChange={(v) => setSelectedId(v ? parseInt(v, 10) : null)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={t('academicHistory.selectSemester')} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.is_current ? <Badge variant="secondary" className="text-xs">{isArabic ? 'حالي' : 'Current'}</Badge> : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedId && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleSetCurrent(selectedId)} disabled={summary?.is_current}>
                  <Star className="w-4 h-4 mr-1" />
                  {t('academicHistory.setCurrent')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedId)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{summary.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? 'المادة' : 'Course'}</TableHead>
                      <TableHead>{t('academicHistory.grade')}</TableHead>
                      <TableHead>{t('academicHistory.letter')}</TableHead>
                      <TableHead>{t('academicHistory.gpaPoints')}</TableHead>
                      <TableHead>{isArabic ? 'الساعات' : 'Hours'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.courses?.length ? summary.courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.course_name} ({c.course_code})</TableCell>
                        <TableCell>{c.current_grade != null ? Number(c.current_grade).toFixed(1) : '—'}</TableCell>
                        <TableCell>{c.letter_grade ?? '—'}</TableCell>
                        <TableCell>{c.gpa_points != null ? Number(c.gpa_points).toFixed(2) : '—'}</TableCell>
                        <TableCell>{c.credit_hours ?? 0}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {isArabic ? 'لا مواد في هذا الفصل' : 'No courses in this semester'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('academicHistory.hoursRegistered')}</p>
                    <p className="text-lg font-semibold">{summary.hours_registered ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('academicHistory.hoursCompleted')}</p>
                    <p className="text-lg font-semibold">{summary.hours_completed ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('academicHistory.hoursCarried')}</p>
                    <p className="text-lg font-semibold">{summary.hours_carried ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('academicHistory.semesterGpa')}</p>
                    <p className="text-lg font-semibold">{(summary.semester_gpa ?? 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">{t('academicHistory.appRating')}:</span>
                  <Badge variant="secondary" className="font-medium">
                    {ratingLabel(summary.app_rating_computed ?? summary.app_rating)}
                  </Badge>
                  {summary.app_rating_computed != null && (
                    <span className="text-xs text-muted-foreground">({isArabic ? 'حسب المعدل' : 'by GPA'})</span>
                  )}
                </div>
                {unassignedCourses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t mt-4">
                    <span className="text-sm text-muted-foreground">{isArabic ? 'تعيين مادة لهذا الفصل:' : 'Assign course to this semester:'}</span>
                    <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder={isArabic ? 'اختر مادة' : 'Select course'} />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedCourses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.course_name} ({c.course_code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={assignCourseToSemester} disabled={!assignCourseId || assigning}>
                      {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : (isArabic ? 'تعيين' : 'Assign')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('academicHistory.nextSuggestions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={loadSuggestions} disabled={loadingSuggestions}>
                {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('academicHistory.loadSuggestions')}
              </Button>
              {suggestions.length > 0 && (
                <ul className="mt-4 space-y-2 list-disc list-inside">
                  {suggestions.slice(0, 10).map((s, i) => (
                    <li key={s.id || i}>
                      <strong>{s.course_name}</strong> ({s.course_code}) — {s.reason || (isArabic ? 'مناسب حسب المتطلبات والعلامات' : 'Suggested by prerequisites and grades')}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academicHistory.addSemester')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('academicHistory.semesterName')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={isArabic ? 'مثال: السنة الأولى الفصل الأول 2022/2023' : 'e.g. Year 1 Semester 1 2022/2023'}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="formCurrent" checked={formCurrent} onChange={(e) => setFormCurrent(e.target.checked)} />
              <Label htmlFor="formCurrent">{t('academicHistory.setCurrent')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSemester} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isArabic ? 'إضافة' : 'Add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
