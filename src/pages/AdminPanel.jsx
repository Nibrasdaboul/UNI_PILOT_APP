import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CheckSquare,
  Trash2,
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  FolderTree,
  ChevronRight,
  FileText,
  Link as LinkIcon,
  BarChart3,
  Cpu,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { api, user } = useAuth();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseResources, setCourseResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', url: '' });
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    department: '',
    description: '',
    credit_hours: 3,
    order: 1,
    prerequisite_id: null,
  });
  const [newNotification, setNewNotification] = useState({ title: '', body: '' });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [usage, setUsage] = useState(null);
  const [aiCosts, setAiCosts] = useState(null);

  const openAddDialog = () => {
    setEditingCourse(null);
    setNewCourse({
      course_code: '',
      course_name: '',
      department: '',
      description: '',
      credit_hours: 3,
      order: (catalog.length + 1),
      prerequisite_id: null,
    });
    setCatalogDialogOpen(true);
  };
  const openEditDialog = (course) => {
    setEditingCourse(course);
    setNewCourse({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      department: course.department || '',
      description: course.description || '',
      credit_hours: course.credit_hours ?? 3,
      order: course.order ?? 1,
      prerequisite_id: course.prerequisite_id ?? null,
    });
    setCatalogDialogOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!catalogDialogOpen || !editingCourse?.id) {
      setCourseResources([]);
      return;
    }
    (async () => {
      try {
        const rRes = await api.get(`/catalog/courses/${editingCourse.id}/resources`);
        setCourseResources(rRes.data || []);
      } catch (_) {
        setCourseResources([]);
      }
    })();
  }, [catalogDialogOpen, editingCourse?.id, api]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, catalogRes, usageRes, aiCostsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/catalog/courses'),
        api.get('/admin/usage').catch(() => ({ data: null })),
        api.get('/admin/ai-costs').catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCatalog(catalogRes.data);
      setUsage(usageRes.data);
      setAiCosts(aiCostsRes.data);
    } catch (error) {
      console.error('Admin error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role?role=${newRole}`);
      toast.success(language === 'ar' ? 'تم تحديث الدور' : 'Role updated');
      fetchData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(language === 'ar' ? 'تم حذف المستخدم' : 'User deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleSaveCatalogCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await api.patch(`/catalog/courses/${editingCourse.id}`, newCourse);
        toast.success(language === 'ar' ? 'تم تحديث المادة' : 'Course updated');
      } else {
        await api.post('/catalog/courses', newCourse);
        toast.success(language === 'ar' ? 'تمت إضافة المادة للكتالوج' : 'Course added to catalog');
      }
      setCatalogDialogOpen(false);
      setEditingCourse(null);
      setNewCourse({ course_code: '', course_name: '', department: '', description: '', credit_hours: 3, order: 1, prerequisite_id: null });
      fetchData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteCatalogCourse = async (courseId) => {
    try {
      await api.delete(`/catalog/courses/${courseId}`);
      toast.success(language === 'ar' ? 'تم حذف المادة من الكتالوج' : 'Course removed from catalog');
      fetchData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const addResource = async () => {
    if (!editingCourse?.id) return;
    const title = (newResource.title || '').trim() || (language === 'ar' ? 'ملف' : 'File');
    const url = (newResource.url || '').trim() || null;
    try {
      const res = await api.post(`/catalog/courses/${editingCourse.id}/resources`, { title, url });
      setCourseResources((prev) => [...prev, res.data]);
      setNewResource({ title: '', url: '' });
      toast.success(language === 'ar' ? 'تمت إضافة الملف' : 'Resource added');
    } catch (_) {
      toast.error(t('common.error'));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    const title = (newNotification.title || '').trim();
    const body = (newNotification.body || '').trim();
    if (!title || !body) {
      toast.error(language === 'ar' ? 'العنوان والنص مطلوبان' : 'Title and message are required');
      return;
    }
    try {
      setSendingNotification(true);
      await api.post('/admin/notifications', { title, body, type: 'info' });
      toast.success(language === 'ar' ? 'تم إرسال الإشعار لجميع الطلاب' : 'Notification sent to all students');
      setNewNotification({ title: '', body: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setSendingNotification(false);
    }
  };

  const deleteResource = async (rid) => {
    if (!editingCourse?.id) return;
    try {
      await api.delete(`/catalog/courses/${editingCourse.id}/resources/${rid}`);
      setCourseResources((prev) => prev.filter((r) => r.id !== rid));
      toast.success(language === 'ar' ? 'تم حذف الملف' : 'Resource removed');
    } catch (_) {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse h-32 rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" data-testid="admin-page">
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          {t('admin.title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {language === 'ar' ? 'إدارة المستخدمين والنظام' : 'Manage users and system settings'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('admin.totalUsers')} 
          value={stats?.total_users || 0} 
          icon={Users}
          color="primary"
        />
        <StatsCard 
          title={t('admin.totalStudents')} 
          value={stats?.total_students || 0} 
          icon={GraduationCap}
          color="secondary"
        />
        <StatsCard 
          title={t('admin.totalCourses')} 
          value={stats?.total_courses || 0} 
          icon={BookOpen}
          color="accent"
        />
        <StatsCard 
          title={t('admin.totalTasks')} 
          value={stats?.total_tasks || 0} 
          icon={CheckSquare}
          color="primary"
        />
      </div>

      {/* Usage & AI costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'استخدام الذكاء الاصطناعي' : 'AI Usage'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'هذه الفترة (شهري)' : 'Current period (monthly)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {usage ? (
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">{language === 'ar' ? 'الفترة: ' : 'Period: '}</span>{usage.period_start}</p>
                <p><span className="text-muted-foreground">{language === 'ar' ? 'إجمالي طلبات الذكاء الاصطناعي: ' : 'Total AI requests: '}</span><strong>{usage.total_ai_requests ?? 0}</strong></p>
                {Array.isArray(usage.users_by_plan) && usage.users_by_plan.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">{language === 'ar' ? 'المستخدمون حسب الخطة: ' : 'Users by plan: '}</p>
                    <ul className="list-disc list-inside">
                      {usage.users_by_plan.map((p) => (
                        <li key={p.plan_id}>{p.plan_id}: {p.c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{language === 'ar' ? 'غير متوفر' : 'Not available'}</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'تكلفة الذكاء الاصطناعي (7 أيام)' : 'AI Cost (last 7 days)'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'طلبات حسب الميزة' : 'Requests by feature'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {aiCosts?.last_7_days_by_feature?.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {aiCosts.last_7_days_by_feature.map((f) => (
                  <li key={f.feature} className="flex justify-between">
                    <span>{f.feature}</span>
                    <span><strong>{f.c}</strong> {f.tokens ? `(~${f.tokens} tok)` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display">{t('admin.manageUsers')}</CardTitle>
          <CardDescription>{language === 'ar' ? 'عرض وإدارة جميع المستخدمين' : 'View and manage all users'}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                <TableHead>{language === 'ar' ? 'البريد' : 'Email'}</TableHead>
                <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                <TableHead>{language === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-full">
                      {u.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.plan_id || 'free'}
                      onValueChange={async (v) => {
                        try {
                          await api.patch(`/admin/users/${u.id}/subscription`, { plan_id: v });
                          toast.success(language === 'ar' ? 'تم تحديث الخطة' : 'Plan updated');
                          fetchData();
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || t('common.error'));
                        }
                      }}
                      disabled={u.id === user?.id}
                    >
                      <SelectTrigger className="w-28 h-8 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={u.role} 
                        onValueChange={(v) => handleChangeRole(u.id, v)}
                        disabled={u.id === user?.id}
                      >
                        <SelectTrigger className="w-32 h-8 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notifications – send to students */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {language === 'ar' ? 'إرسال إشعار للطلاب' : 'Send notification to students'}
          </CardTitle>
          <CardDescription>
            {language === 'ar'
              ? 'اكتب عنواناً ورسالة قصيرة لإرسالها لجميع الطلاب في النظام.'
              : 'Write a title and short message to send to all students.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSendNotification} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label>{language === 'ar' ? 'عنوان الإشعار' : 'Notification title'}</Label>
              <Input
                value={newNotification.title}
                onChange={(e) => setNewNotification((n) => ({ ...n, title: e.target.value }))}
                className="rounded-xl"
                maxLength={120}
                placeholder={language === 'ar' ? 'مثال: تذكير بموعد الاختبار' : 'e.g. Exam reminder'}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{language === 'ar' ? 'نص الإشعار' : 'Notification message'}</Label>
              <Textarea
                value={newNotification.body}
                onChange={(e) => setNewNotification((n) => ({ ...n, body: e.target.value }))}
                className="rounded-xl min-h-[90px]"
                maxLength={600}
                placeholder={
                  language === 'ar'
                    ? 'اكتب تعليمات أو تذكيراً مختصراً يظهر في قائمة الإشعارات لدى الطلاب.'
                    : 'Write a short notice or reminder that will appear in the students’ notifications list.'
                }
              />
            </div>
            <Button type="submit" className="rounded-xl" disabled={sendingNotification}>
              {sendingNotification
                ? language === 'ar'
                  ? 'جاري الإرسال...'
                  : 'Sending...'
                : language === 'ar'
                ? 'إرسال الإشعار'
                : 'Send notification'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Course Tree - full catalog */}
      <Card className="rounded-[2rem]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              {t('admin.courseTree')}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'شجرة المواد الكاملة وإجمالي الساعات' : 'Full course tree and total credit hours'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t('admin.totalCatalogHours')}: {catalog.reduce((sum, c) => sum + (c.credit_hours ?? 0), 0)}h
            </Badge>
            <Link to="/subject-tree">
              <Button variant="outline" size="sm" className="rounded-xl">
                {language === 'ar' ? 'عرض الشجرة' : 'View Tree'}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {catalog.length === 0 ? (
            <p className="text-muted-foreground py-4">{language === 'ar' ? 'لا توجد مواد في الكتالوج' : 'No courses in catalog'}</p>
          ) : (
            <div className="space-y-1">
              {[...catalog]
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                .map((course, idx) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-muted/50"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="rounded-full text-xs shrink-0">{course.course_code}</Badge>
                    <span className="font-medium flex-1">{course.course_name}</span>
                    <span className="text-sm text-muted-foreground">{course.credit_hours ?? 0}h</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Catalog CRUD */}
      <Card className="rounded-[2rem]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">{t('admin.catalogManagement')}</CardTitle>
            <CardDescription>{language === 'ar' ? 'إدارة كتالوج المواد (إضافة، تعديل، حذف)' : 'Manage catalog: add, edit, delete courses'}</CardDescription>
          </div>
          <Dialog open={catalogDialogOpen} onOpenChange={(open) => { setCatalogDialogOpen(open); if (!open) setEditingCourse(null); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.addCatalogCourse')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCourse ? t('admin.editCatalogCourse') : t('admin.addCatalogCourse')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCatalogCourse} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.courseCode')}</Label>
                    <Input 
                      value={newCourse.course_code}
                      onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})}
                      required
                      className="rounded-xl"
                      placeholder="CS301"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.department')}</Label>
                    <Input 
                      value={newCourse.department}
                      onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                      required
                      className="rounded-xl"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.courseName')}</Label>
                  <Input 
                    value={newCourse.course_name}
                    onChange={(e) => setNewCourse({...newCourse, course_name: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.creditHours')}</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={24}
                      value={newCourse.credit_hours}
                      onChange={(e) => setNewCourse({...newCourse, credit_hours: parseInt(e.target.value, 10) || 3})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.order')}</Label>
                    <Input 
                      type="number"
                      min={1}
                      value={newCourse.order}
                      onChange={(e) => setNewCourse({...newCourse, order: parseInt(e.target.value, 10) || 1})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.prerequisite')}</Label>
                  <Select
                    value={newCourse.prerequisite_id != null ? String(newCourse.prerequisite_id) : 'none'}
                    onValueChange={(v) => setNewCourse({...newCourse, prerequisite_id: v === 'none' ? null : parseInt(v, 10)})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={language === 'ar' ? 'بدون' : 'None'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{language === 'ar' ? 'بدون متطلب' : 'None'}</SelectItem>
                      {catalog
                        .filter((c) => c.id !== editingCourse?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.course_code} – {c.course_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                  <Input 
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="rounded-xl"
                    placeholder="Optional"
                  />
                </div>

                {editingCourse && (
                  <>
                    <div className="border-t pt-4 space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {language === 'ar' ? 'ملفات المادة / محاضرات' : 'Course files & resources'}
                      </Label>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {courseResources.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-muted/50">
                            <span className="truncate font-medium">{r.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {r.url && (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center">
                                  <LinkIcon className="w-3 h-3" />
                                </a>
                              )}
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteResource(r.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 flex-wrap">
                        <Input
                          placeholder={language === 'ar' ? 'عنوان الملف' : 'Title'}
                          value={newResource.title}
                          onChange={(e) => setNewResource((p) => ({ ...p, title: e.target.value }))}
                          className="rounded-xl max-w-[140px]"
                        />
                        <Input
                          placeholder="URL"
                          value={newResource.url}
                          onChange={(e) => setNewResource((p) => ({ ...p, url: e.target.value }))}
                          className="rounded-xl flex-1 min-w-[120px]"
                        />
                        <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={addResource}>
                          <Plus className="w-4 h-4 mr-1" />
                          {language === 'ar' ? 'إضافة' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setCatalogDialogOpen(false)} className="flex-1 rounded-xl">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl">{t('common.save')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((course) => (
              <Card key={course.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="rounded-full text-xs mb-2">{course.course_code}</Badge>
                    <h4 className="font-bold">{course.course_name}</h4>
                    <p className="text-sm text-muted-foreground">{course.department}</p>
                    <p className="text-xs text-muted-foreground mt-1">{course.credit_hours ?? 0} {language === 'ar' ? 'ساعة' : 'hrs'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(course)} title={t('common.edit')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCatalogCourse(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent'
  };

  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
