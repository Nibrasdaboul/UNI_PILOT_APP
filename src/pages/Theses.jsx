import { useState } from 'react';
import {
  BookOpen,
  Link2,
  FileText,
  Loader2,
  ExternalLink,
  Youtube,
  GraduationCap,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const HELP_TYPES = [
  { value: 'scientific_research', labelKey: 'scientificResearch' },
  { value: 'seminar', labelKey: 'seminar' },
  { value: 'report', labelKey: 'report' },
  { value: 'thesis_masters', labelKey: 'thesisMasters' },
  { value: 'thesis_phd', labelKey: 'thesisPhd' },
];

const SOURCE_TYPE_ICONS = {
  website: Globe,
  youtube: Youtube,
  academic: GraduationCap,
};

export default function Theses() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [helpType, setHelpType] = useState('scientific_research');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [helpContent, setHelpContent] = useState('');

  const lang = language === 'ar' ? 'ar' : 'en';
  const topicTrim = topic.trim();

  const handleGetSources = async () => {
    if (!topicTrim) {
      toast.error(t('theses.noTopic'));
      return;
    }
    setSourcesLoading(true);
    setSources([]);
    try {
      const r = await api.post('/theses/sources', { topic: topicTrim, lang });
      setSources(r.data?.sources || []);
      if ((r.data?.sources || []).length === 0) toast.info(language === 'ar' ? 'لم يتم العثور على مصادر' : 'No sources returned');
      else toast.success(language === 'ar' ? 'تم جلب المصادر' : 'Sources loaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'ar' ? 'فشل جلب المصادر' : 'Failed to load sources'));
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleGetHelp = async () => {
    if (!topicTrim) {
      toast.error(t('theses.noTopic'));
      return;
    }
    setHelpLoading(true);
    setHelpContent('');
    try {
      const r = await api.post('/theses/help', {
        topic: topicTrim,
        type: helpType,
        extra_prompt: extraPrompt.trim() || undefined,
        lang,
      });
      setHelpContent(r.data?.content || '');
      if (!r.data?.content) toast.info(language === 'ar' ? 'لم يتم إرجاع محتوى' : 'No content returned');
      else toast.success(language === 'ar' ? 'تم إنشاء الإرشادات' : 'Help generated');
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'ar' ? 'فشل إنشاء المساعدة' : 'Failed to generate help'));
    } finally {
      setHelpLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          {t('theses.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('theses.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'ar' ? 'الموضوع ونوع العمل' : 'Topic & type'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'حدد موضوع البحث ونوع العمل (بحث علمي، حلقة بحث، تقرير، رسالة ماجستير/دكتوراه).' : 'Enter your research topic and the type of work (research, seminar, report, thesis).'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">{t('theses.topicPlaceholder')}</Label>
            <Input
              id="topic"
              placeholder={t('theses.topicPlaceholder')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('theses.typeLabel')}</Label>
            <Select value={helpType} onValueChange={setHelpType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HELP_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(`theses.${opt.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra">{t('theses.extraInstructions')}</Label>
            <Textarea
              id="extra"
              placeholder={t('theses.extraInstructions')}
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGetSources}
              disabled={sourcesLoading || !topicTrim}
              variant="outline"
              className="gap-2"
            >
              {sourcesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {t('theses.getSources')}
            </Button>
            <Button
              onClick={handleGetHelp}
              disabled={helpLoading || !topicTrim}
              className="gap-2"
            >
              {helpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {t('theses.getHelp')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t('theses.sourcesTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sources.length === 0 && !sourcesLoading && (
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? 'اضغط "الحصول على المصادر والمراجع" بعد إدخال الموضوع.' : 'Click "Get sources & references" after entering your topic.'}
              </p>
            )}
            {sources.length > 0 && (
              <ScrollArea className="h-[320px] pr-4">
                <ul className="space-y-3">
                  {sources.map((s, i) => {
                    const Icon = SOURCE_TYPE_ICONS[s.type] || Globe;
                    return (
                      <li key={i} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {t(`theses.${s.type}`)}
                            </span>
                            <p className="font-medium truncate" title={s.title}>{s.title}</p>
                            {s.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                            )}
                            {s.url && (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {language === 'ar' ? 'فتح الرابط' : 'Open link'}
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('theses.helpTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!helpContent && !helpLoading && (
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? 'اضغط "الحصول على مساعدة الكتابة بالذكاء الاصطناعي" لاستلام هيكل ونصائح وإرشادات.' : 'Click "Get AI writing help" to receive structure, tips, and guidance.'}
              </p>
            )}
            {helpContent && (
              <ScrollArea className="h-[320px] pr-4">
                <div
                  className={cn(
                    'prose prose-sm dark:prose-invert max-w-none',
                    language === 'ar' && 'prose-body:rtl'
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-transparent p-0 border-0">
                    {helpContent}
                  </pre>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
