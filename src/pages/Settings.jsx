import { useState } from 'react';
import { User, Globe, Moon, Sun, Save, Download, Trash2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user, updateSettings, exportData, deleteAccount } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ 
        full_name: fullName,
        language,
        theme
      });
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-2xl w-full min-w-0" data-testid="settings-page">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          {t('profile.title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {language === 'ar' ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}
        </p>
      </div>

      {/* Personal Info */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="font-display">{t('profile.personalInfo')}</CardTitle>
              <CardDescription>{language === 'ar' ? 'معلوماتك الشخصية' : 'Your personal information'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.fullName')}</Label>
            <Input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.email')}</Label>
            <Input 
              value={user?.email || ''}
              disabled
              className="rounded-xl bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="font-display">{t('profile.preferences')}</CardTitle>
              <CardDescription>{language === 'ar' ? 'تخصيص تجربتك' : 'Customize your experience'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">{t('common.language')}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اختر لغة الواجهة' : 'Choose interface language'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={language === 'en' ? 'font-bold' : 'text-muted-foreground'}>EN</span>
              <Switch 
                checked={language === 'ar'}
                onCheckedChange={(checked) => setLanguage(checked ? 'ar' : 'en')}
              />
              <span className={language === 'ar' ? 'font-bold' : 'text-muted-foreground'}>AR</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">{t('common.theme')}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اختر مظهر التطبيق' : 'Choose app appearance'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
              <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        className="w-full h-12 rounded-xl font-bold gap-2"
        onClick={handleSave}
        disabled={saving}
      >
        <Save className="w-5 h-5" />
        {saving ? t('common.loading') : t('profile.saveChanges')}
      </Button>

      {/* Data & Privacy */}
      <Card className="rounded-[2rem] border-amber-500/20">
        <CardHeader>
          <CardTitle className="font-display">
            {language === 'ar' ? 'البيانات والخصوصية' : 'Data & Privacy'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'تصدير بياناتك أو حذف حسابك. انظر سياسة الخصوصية وشروط الخدمة.' : 'Export your data or delete your account. See Privacy Policy and Terms of Service.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={async () => { setExporting(true); try { await exportData(); toast.success(language === 'ar' ? 'تم تنزيل الملف' : 'Download started'); } catch (e) { toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed'); } finally { setExporting(false); } }} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تصدير بياناتي' : 'Export my data'}
            </Button>
            <Link to="/privacy"><Button variant="ghost" size="sm">{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Button></Link>
            <Link to="/terms"><Button variant="ghost" size="sm">{language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</Button></Link>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={deleting}>
                <Trash2 className="w-4 h-4" />
                {language === 'ar' ? 'حذف حسابي' : 'Delete my account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{language === 'ar' ? 'حذف الحساب نهائياً؟' : 'Delete account permanently?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'ar' ? 'سيتم حذف كل بياناتك ولا يمكن التراجع. يفضّل تصدير بياناتك أولاً.' : 'All your data will be deleted and cannot be undone. We recommend exporting your data first.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                      toast.success(language === 'ar' ? 'تم حذف الحساب' : 'Account deleted');
                      window.location.href = '/';
                    } catch (e) {
                      toast.error(e?.response?.data?.detail || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'));
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {language === 'ar' ? 'نعم، احذف حسابي' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
