import { useState, useRef } from 'react';
import {
  LayoutGrid,
  Map,
  Route,
  GitBranch,
  Clock,
  GitBranchIcon,
  CircleDot,
  Filter,
  ArrowDownToLine,
  Loader2,
  Upload,
  FileText,
  BookOpen,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import InteractiveDiagramCards from '@/components/InteractiveDiagramCards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportArabicPdf, exportContentWithChartsPdf } from '@/lib/pdfArabicExport';

const DIAGRAM_TYPES = [
  { value: 'mind_map', labelKey: 'mindMap', icon: Map },
  { value: 'roadmap', labelKey: 'roadmap', icon: Route },
  { value: 'flowchart', labelKey: 'flowchart', icon: GitBranch },
  { value: 'timeline', labelKey: 'timeline', icon: Clock },
  { value: 'tree', labelKey: 'tree', icon: GitBranchIcon },
  { value: 'venn', labelKey: 'venn', icon: CircleDot },
  { value: 'pyramid', labelKey: 'pyramid', icon: Filter },
  { value: 'funnel', labelKey: 'funnel', icon: ArrowDownToLine },
  { value: 'fishbone', labelKey: 'fishbone', icon: GitBranch },
];

const INFO_TYPES = [
  { value: 'timeline', labelKey: 'timeline' },
  { value: 'bar', labelKey: 'bar' },
  { value: 'pie', labelKey: 'pie' },
  { value: 'line', labelKey: 'line' },
  { value: 'comparison', labelKey: 'comparison' },
  { value: 'process', labelKey: 'process' },
];

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Infographics() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('diagrams');
  const [mode, setMode] = useState('from_content'); // from_content | custom
  const [text, setText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [diagramType, setDiagramType] = useState('mind_map');
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [diagramData, setDiagramData] = useState(null);
  const [diagramStateForPdf, setDiagramStateForPdf] = useState(null);

  const [infographicType, setInfographicType] = useState('timeline');
  const [infographicText, setInfographicText] = useState('');
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [infographicData, setInfographicData] = useState(null);

  const [researchTopic, setResearchTopic] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchData, setResearchData] = useState(null);

  const diagramExportRef = useRef(null);
  const infographicExportRef = useRef(null);
  const researchContentRef = useRef(null);

  const lang = language === 'ar' ? 'ar' : 'en';
  const pdfSubtitle = language === 'ar' ? 'المخططات والانفوغرافيك - UniPilot' : 'Mind Maps & Infographics - UniPilot';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isTxt = file.type === 'text/plain' || /\.txt$/i.test(file.name);
    if (isTxt) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result || '';
        setText(String(content));
        toast.success(language === 'ar' ? 'تم تحميل النص' : 'Text loaded');
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      const reader = new FileReader();
      reader.onload = () => setText(String(reader.result || ''));
      reader.readAsText(file, 'UTF-8');
      toast.success(language === 'ar' ? 'تم تحميل الملف' : 'File loaded');
    }
    e.target.value = '';
  };

  const handleGenerateDiagram = async () => {
    if (mode === 'from_content' && !text.trim()) {
      toast.error(t('diagrams.noContent'));
      return;
    }
    if (mode === 'custom' && !customTitle.trim()) {
      toast.error(t('diagrams.noContent'));
      return;
    }
    setDiagramLoading(true);
    setDiagramData(null);
    try {
      if (mode === 'custom') {
        const r = await api.post('/diagrams/custom', { title: customTitle.trim(), diagramType, lang });
        setDiagramData(r.data);
        toast.success(language === 'ar' ? 'تم إنشاء المخطط' : 'Diagram generated');
      } else {
        const r = await api.post('/diagrams/from-content', { text: text.trim(), diagramType, lang });
        setDiagramData(r.data);
        toast.success(language === 'ar' ? 'تم إنشاء المخطط' : 'Diagram generated');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'ar' ? 'فشل إنشاء المخطط' : 'Failed'));
    } finally {
      setDiagramLoading(false);
    }
  };

  const handleGenerateInfographic = async () => {
    if (!infographicText.trim()) {
      toast.error(t('diagrams.noContent'));
      return;
    }
    setInfographicLoading(true);
    setInfographicData(null);
    try {
      const r = await api.post('/diagrams/infographic', {
        text: infographicText.trim(),
        infographicType,
        lang,
      });
      setInfographicData(r.data);
      toast.success(language === 'ar' ? 'تم إنشاء الانفوغرافيك' : 'Infographic generated');
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'ar' ? 'فشل' : 'Failed'));
    } finally {
      setInfographicLoading(false);
    }
  };

  const handleExportDiagramPdf = async () => {
    if (!diagramExportRef.current) {
      toast.error(language === 'ar' ? 'لا يوجد مخطط لتصديره' : 'No diagram to export');
      return;
    }
    const payload = diagramStateForPdf || diagramData;
    const title = payload?.title || (language === 'ar' ? 'مخطط' : 'Diagram');
    try {
      toast.info(language === 'ar' ? 'جاري إنشاء PDF...' : 'Creating PDF...');
      const doc = await exportContentWithChartsPdf(diagramExportRef.current, title, pdfSubtitle, language);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم تنزيل PDF' : 'PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  const handleExportInfographicPdf = async () => {
    if (!infographicExportRef.current) {
      toast.error(language === 'ar' ? 'لا يوجد انفوغرافيك لتصديره' : 'No infographic to export');
      return;
    }
    const title = infographicData?.title || (language === 'ar' ? 'انفوغرافيك' : 'Infographic');
    try {
      toast.info(language === 'ar' ? 'جاري إنشاء PDF...' : 'Creating PDF...');
      const doc = await exportContentWithChartsPdf(infographicExportRef.current, title, pdfSubtitle, language);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infographic-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم تنزيل PDF' : 'PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  const handleGenerateFullResearch = async () => {
    if (!researchTopic.trim()) {
      toast.error(t('diagrams.noContent'));
      return;
    }
    setResearchLoading(true);
    setResearchData(null);
    try {
      const r = await api.post('/diagrams/research-full', { topic: researchTopic.trim(), lang });
      setResearchData(r.data);
      toast.success(language === 'ar' ? 'تم إنشاء البحث الكامل' : 'Full research generated');
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'ar' ? 'فشل' : 'Failed'));
    } finally {
      setResearchLoading(false);
    }
  };

  const handleExportResearchPdf = async () => {
    if (!researchContentRef.current) {
      toast.error(language === 'ar' ? 'لا يوجد بحث لتصديره' : 'No research to export');
      return;
    }
    const title = researchData?.title || (language === 'ar' ? 'بحث' : 'Research');
    try {
      toast.info(language === 'ar' ? 'جاري إنشاء PDF (يتضمن الرسوم والدوائر)...' : 'Creating PDF (with charts & diagrams)...');
      const doc = await exportContentWithChartsPdf(researchContentRef.current, title, pdfSubtitle, language);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم تنزيل PDF' : 'PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" data-testid="infographics-page">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutGrid className="h-7 w-7" />
          {t('diagrams.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('diagrams.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="diagrams" className="gap-2">
            <Map className="h-4 w-4" />
            {t('diagrams.tabDiagrams')}
          </TabsTrigger>
          <TabsTrigger value="infographics" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t('diagrams.tabInfographics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagrams" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('diagrams.tabDiagrams')}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'اختر مصدر المحتوى (نص/ملف أو عنوان مخصص) ونوع المخطط ثم انقر إنشاء.' : 'Choose source (text/file or custom title) and diagram type, then generate.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'from_content'}
                    onChange={() => setMode('from_content')}
                    className="rounded"
                  />
                  <FileText className="h-4 w-4" />
                  {t('diagrams.fromContent')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'custom'}
                    onChange={() => setMode('custom')}
                    className="rounded"
                  />
                  <Route className="h-4 w-4" />
                  {t('diagrams.customTopic')}
                </label>
              </div>
              {mode === 'from_content' ? (
                <>
                  <div className="space-y-2">
                    <Label>{t('diagrams.pasteOrUpload')}</Label>
                    <Textarea
                      placeholder={t('diagrams.pasteOrUpload')}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('diag-file').click()}>
                        <Upload className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'رفع ملف' : 'Upload file'}
                      </Button>
                      <input id="diag-file" type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleFileChange} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>{t('diagrams.customTitlePlaceholder')}</Label>
                  <Input
                    placeholder={t('diagrams.customTitlePlaceholder')}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>{t('diagrams.diagramType')}</Label>
                <Select value={diagramType} onValueChange={setDiagramType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGRAM_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(`diagrams.${opt.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateDiagram} disabled={diagramLoading} className="gap-2">
                {diagramLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Map className="h-4 w-4" />}
                {t('diagrams.generateDiagram')}
              </Button>
            </CardContent>
          </Card>

          {diagramData && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{diagramData.title}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportDiagramPdf} className="gap-1">
                  <ArrowDownToLine className="h-4 w-4" />
                  {t('diagrams.exportPdf')}
                </Button>
              </CardHeader>
              <CardContent ref={diagramExportRef} className="bg-muted/20 rounded-lg p-4">
                <InteractiveDiagramCards
                  data={diagramData}
                  editable
                  onDataChange={setDiagramStateForPdf}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="infographics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('diagrams.tabInfographics')}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أدخل النص أو وصف البيانات لإنشاء انفوغرافيك (خط زمني، أعمدة، دائري، مقارنة، عملية).' : 'Enter text or data description to generate infographic (timeline, bar, pie, comparison, process).'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('diagrams.infographicType')}</Label>
                <Select value={infographicType} onValueChange={setInfographicType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INFO_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(`diagrams.${opt.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('diagrams.pasteOrUpload')}</Label>
                <Textarea
                  placeholder={language === 'ar' ? 'صف الموضوع أو الصق البيانات...' : 'Describe topic or paste data...'}
                  value={infographicText}
                  onChange={(e) => setInfographicText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleGenerateInfographic} disabled={infographicLoading} className="gap-2">
                {infographicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />}
                {t('diagrams.generateInfographic')}
              </Button>
            </CardContent>
          </Card>

          {infographicData && infographicData.data?.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{infographicData.title}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportInfographicPdf} className="gap-1">
                  <ArrowDownToLine className="h-4 w-4" />
                  {t('diagrams.exportPdf')}
                </Button>
              </CardHeader>
              <CardContent ref={infographicExportRef} className="bg-muted/20 rounded-lg p-4">
                <InfographicRender data={infographicData} />
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('diagrams.fullResearch')}
              </CardTitle>
              <CardDescription>{t('diagrams.fullResearchDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('diagrams.fullResearchTopic')}</Label>
                <Input
                  placeholder={t('diagrams.fullResearchTopicPlaceholder')}
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerateFullResearch} disabled={researchLoading} className="gap-2">
                {researchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                {t('diagrams.generateFullResearch')}
              </Button>
            </CardContent>
          </Card>

          {researchData && researchData.sections?.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{researchData.title}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportResearchPdf} className="gap-1">
                  <ArrowDownToLine className="h-4 w-4" />
                  {t('diagrams.exportPdf')}
                </Button>
              </CardHeader>
              <CardContent className="bg-muted/20 rounded-lg p-4 space-y-8">
                <div ref={researchContentRef} className="space-y-8 bg-background rounded-lg p-4">
                  {researchData.summary && (
                    <p className="text-muted-foreground leading-relaxed border-l-4 border-primary pl-4 py-2">{researchData.summary}</p>
                  )}
                  <FullResearchRender sections={researchData.sections} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfographicRender({ data }) {
  const { language } = useLanguage();
  const { infographicType, title, data: items } = data || {};
  const chartData = (items || []).map((d, i) => ({
    name: d.label?.slice(0, 20) || `Item ${i + 1}`,
    value: typeof d.value === 'number' ? d.value : (items?.length || 0) - i,
    ...d,
  }));

  if (infographicType === 'bar') {
    return (
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (infographicType === 'pie') {
    return (
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(e) => e.name?.slice(0, 12)}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (infographicType === 'line') {
    return (
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (infographicType === 'timeline' || infographicType === 'process') {
    return (
      <ScrollArea className="h-[320px]">
        <div className={cn('space-y-3', language === 'ar' && 'text-right')} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {(items || []).map((d, i) => (
            <div key={i} className="flex gap-3 items-start border-l-2 border-primary pl-4 py-1">
              <span className="text-sm font-medium text-primary shrink-0">{(d.date || d.order) ?? (i + 1)}</span>
              <div>
                <p className="font-medium">{d.label}</p>
                {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }
  if (infographicType === 'comparison') {
    return (
      <ScrollArea className="h-[320px]">
        <div className="space-y-4">
          {(items || []).map((d, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="font-medium mb-2">{d.label}</p>
              {Array.isArray(d.items) && (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {d.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }
  return (
    <ScrollArea className="h-[320px]">
      <ul className="space-y-2">
        {(items || []).map((d, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-medium">{d.label}</span>
            {d.value != null && <span className="text-muted-foreground">({d.value})</span>}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

function FullResearchRender({ sections }) {
  const { language } = useLanguage();
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return (
    <div className="space-y-8">
      {sections.map((sec, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-base font-semibold text-foreground border-b pb-2">{sec.title}</h3>
          {sec.type === 'key_facts' && Array.isArray(sec.items) && (
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {sec.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {sec.type === 'progress_rings' && Array.isArray(sec.data) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sec.data.map((d, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${CHART_COLORS[i % CHART_COLORS.length]} ${(d.value || 0) * 3.6}deg, #e5e7eb 0deg)` }}>
                    <div className="absolute inset-1.5 rounded-full bg-background flex items-center justify-center text-sm font-bold">{d.value ?? 0}%</div>
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">{d.label}</span>
                </div>
              ))}
            </div>
          )}
          {sec.type === 'stats_cards' && Array.isArray(sec.data) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sec.data.map((d, i) => (
                <div key={i} className="rounded-xl border p-4 bg-card flex flex-col items-center gap-1">
                  <User className="h-8 w-8 text-primary/70" />
                  <span className="text-2xl font-bold text-primary">{d.value ?? '—'}</span>
                  <span className="text-xs font-medium text-center">{d.label}</span>
                  {d.subtitle && <span className="text-xs text-muted-foreground text-center">{d.subtitle}</span>}
                </div>
              ))}
            </div>
          )}
          {sec.type === 'timeline' && Array.isArray(sec.data) && (
            <div className={cn('space-y-2', language === 'ar' && 'text-right')} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {sec.data.map((d, i) => (
                <div key={i} className="flex gap-3 items-start border-l-2 border-primary pl-4 py-1">
                  <span className="text-sm font-medium text-primary shrink-0">{(d.date || d.order) ?? (i + 1)}</span>
                  <div>
                    <p className="font-medium">{d.label}</p>
                    {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {sec.type === 'process' && Array.isArray(sec.data) && (
            <div className={cn('space-y-2', language === 'ar' && 'text-right')} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {sec.data.map((d, i) => (
                <div key={i} className="flex gap-3 items-start border-l-2 border-primary pl-4 py-1">
                  <span className="text-sm font-medium text-primary shrink-0">{d.order ?? i + 1}</span>
                  <div>
                    <p className="font-medium">{d.label}</p>
                    {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {sec.type === 'comparison' && Array.isArray(sec.data) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {sec.data.map((d, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="font-medium mb-2">{d.label}</p>
                  {Array.isArray(d.items) && (
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {d.items.map((it, j) => (
                        <li key={j}>{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          {(sec.type === 'bar' || sec.type === 'line' || sec.type === 'pie') && Array.isArray(sec.data) && sec.data.length > 0 && (
            <div className="h-[260px] w-full">
              <InfographicRender data={{ infographicType: sec.type, title: sec.title, data: sec.data }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
