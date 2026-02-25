import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Upload,
  Loader2,
  Square,
  Play,
  Pause,
  Sparkles,
  FileText,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from 'sonner';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

const MAX_CHUNK = 300;
const ALLOWED_EXT = ['pdf', 'docx', 'doc', 'pptx', 'ppt'];

function chunkText(text) {
  if (!text?.trim()) return [];
  const t = text.trim();
  const chunks = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= MAX_CHUNK) {
      chunks.push(rest);
      break;
    }
    const slice = rest.slice(0, MAX_CHUNK);
    const lastPeriod = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('؟'), slice.lastIndexOf('?'), slice.lastIndexOf('\n'));
    const splitAt = lastPeriod > MAX_CHUNK / 2 ? lastPeriod + 1 : MAX_CHUNK;
    chunks.push(rest.slice(0, splitAt).trim());
    rest = rest.slice(splitAt).trim();
  }
  return chunks.filter(Boolean);
}

function hasArabic(str) {
  return /[\u0600-\u06FF]/.test(str || '');
}

export default function ReadTexts() {
  const { api } = useAuth();
  const { t, language: uiLang } = useLanguage();
  const [text, setText] = useState('');
  const [lang, setLang] = useState(uiLang === 'ar' ? 'ar' : 'en');
  const [voiceId, setVoiceId] = useState('');
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTashkeel, setIsTashkeel] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [aiVoiceId, setAiVoiceId] = useState('autumn');
  const [aiVoicesList, setAiVoicesList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const chunkIndexRef = useRef(0);
  const chunksRef = useRef([]);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const currentAudioRef = useRef(null);
  const aiChunksRef = useRef([]);
  const aiFormatRef = useRef('wav');

  const loadVoices = useCallback(() => {
    const s = window.speechSynthesis;
    if (!s) return;
    let list = s.getVoices();
    if (!list.length) {
      s.onvoiceschanged = () => setVoices(s.getVoices());
      return;
    }
    setVoices(list);
  }, []);

  useEffect(() => {
    loadVoices();
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [loadVoices]);

  useEffect(() => {
    const langParam = lang === 'ar' ? 'ar' : 'en';
    api.get(`/tts/voices-ai?lang=${langParam}`).then((r) => {
      const available = !!r.data?.available;
      setAiAvailable(available);
      setAiVoicesList(Array.isArray(r.data?.voices) ? r.data.voices : []);
      if (available && r.data?.voices?.length && !r.data.voices.some((v) => v.id === aiVoiceId)) {
        setAiVoiceId(r.data.voices[0].id);
      }
      if (!available) setUseAiVoice(false);
    }).catch(() => {
      setAiAvailable(false);
      setUseAiVoice(false);
    });
  }, [api, lang]);

  const langCode = lang === 'ar' ? 'ar' : 'en';
  const filteredVoices = voices
    .filter((v) => {
      const vLang = (v.lang || '').toLowerCase();
      if (lang === 'ar') return vLang.startsWith('ar');
      return vLang.startsWith('en');
    })
    .sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const score = (n) => {
        if (n.includes('microsoft') || n.includes('google') || n.includes('natural') || n.includes('online')) return 2;
        if (n.includes('desktop') || n.includes('mobile')) return 1;
        return 0;
      };
      return score(nameB) - score(nameA) || nameA.localeCompare(nameB);
    });

  const handleFileSelect = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error(lang === 'ar' ? 'نوع الملف غير مدعوم. استخدم PDF أو DOCX أو PPTX.' : 'Unsupported file type. Use PDF, DOCX, or PPTX.');
      return;
    }
    setIsExtracting(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const dataUrl = r.result;
          const b64 = dataUrl?.split(',')[1] || '';
          resolve(b64);
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await api.post('/tts/extract', { file_base64: base64, filename: file.name });
      const extracted = res.data?.text ?? '';
      setText((prev) => (prev ? prev + '\n\n' + extracted : extracted));
      toast.success(lang === 'ar' ? 'تم استخراج النص' : 'Text extracted');
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === 'ar' ? 'فشل استخراج النص' : 'Extraction failed'));
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const handleTashkeel = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.info(lang === 'ar' ? 'أدخل نصاً عربياً أولاً' : 'Enter Arabic text first');
      return;
    }
    if (!hasArabic(trimmed)) {
      toast.info(lang === 'ar' ? 'النص لا يحتوي على عربي. التشكيل للنص العربي فقط.' : 'Text has no Arabic. Tashkeel is for Arabic only.');
      return;
    }
    setIsTashkeel(true);
    try {
      const res = await api.post('/tts/tashkeel', { text: trimmed });
      const newText = res.data?.text ?? trimmed;
      setText(newText);
      toast.success(lang === 'ar' ? 'تمت إضافة التشكيل' : 'Diacritics added');
    } catch (err) {
      if (err.response?.status === 503) {
        toast.info(err.response?.data?.detail || (lang === 'ar' ? 'إضافة التشكيل تتطلب إعداد مفتاح الذكاء الاصطناعي' : 'Tashkeel requires AI key'));
      } else {
        toast.error(err.response?.data?.detail || (lang === 'ar' ? 'فشلت إضافة التشكيل' : 'Tashkeel failed'));
      }
    } finally {
      setIsTashkeel(false);
    }
  };

  const playNextAiChunk = useCallback(() => {
    if (chunkIndexRef.current >= aiChunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      currentAudioRef.current = null;
      return;
    }
    const base64 = aiChunksRef.current[chunkIndexRef.current];
    const format = aiFormatRef.current || 'wav';
    const mime = format === 'mp3' ? 'audio/mp3' : 'audio/wav';
    const audio = new Audio(`data:${mime};base64,${base64}`);
    audio.playbackRate = rate;
    currentAudioRef.current = audio;
    audio.onended = () => {
      chunkIndexRef.current += 1;
      playNextAiChunk();
    };
    audio.onerror = () => {
      chunkIndexRef.current += 1;
      playNextAiChunk();
    };
    audio.play().catch(() => {
      chunkIndexRef.current += 1;
      playNextAiChunk();
    });
  }, [rate]);

  const speakNext = useCallback(() => {
    const synth = synthRef.current;
    if (!synth || chunkIndexRef.current >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    const chunk = chunksRef.current[chunkIndexRef.current];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = rate;
    const voice = filteredVoices.find((v) => v.voiceURI === voiceId) || filteredVoices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.onend = () => {
      chunkIndexRef.current += 1;
      speakNext();
    };
    utterance.onerror = () => {
      chunkIndexRef.current += 1;
      speakNext();
    };
    synth.speak(utterance);
  }, [rate, voiceId, lang, filteredVoices]);

  const handlePlay = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.info(t('readTexts.noText'));
      return;
    }
    if (useAiVoice && aiAvailable) {
      setIsGenerating(true);
      try {
        const res = await api.post('/tts/speak', { text: trimmed, voice: aiVoiceId, lang });
        const chunks = res.data?.chunks || [];
        const format = res.data?.format || 'wav';
        if (!chunks.length) {
          toast.error(lang === 'ar' ? 'لم يُرجع السيرفر أي صوت.' : 'No audio returned.');
          return;
        }
        aiChunksRef.current = chunks;
        aiFormatRef.current = format;
        chunkIndexRef.current = 0;
        setIsPlaying(true);
        setIsPaused(false);
        setIsGenerating(false);
        playNextAiChunk();
      } catch (err) {
        setIsGenerating(false);
        toast.error(err.response?.data?.detail || (lang === 'ar' ? 'فشل توليد الصوت' : 'Speech failed'));
      }
      return;
    }
    if (lang === 'ar' && filteredVoices.length === 0) {
      toast.info(t('readTexts.noVoice'));
      return;
    }
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    chunksRef.current = chunkText(trimmed);
    chunkIndexRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    speakNext();
  };

  const handlePause = () => {
    if (useAiVoice && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setIsPaused(true);
      return;
    }
    const synth = synthRef.current;
    if (!synth) return;
    if (synth.speaking) {
      synth.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (useAiVoice && currentAudioRef.current) {
      currentAudioRef.current.play();
      setIsPaused(false);
      return;
    }
    const synth = synthRef.current;
    if (!synth) return;
    if (synth.paused) {
      synth.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (useAiVoice) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      aiChunksRef.current = [];
      chunkIndexRef.current = 0;
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    const synth = synthRef.current;
    if (synth) synth.cancel();
    chunkIndexRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
  };

  const voiceLabel = (v) => {
    const n = (v.name || '').toLowerCase();
    const male = n.includes('male') || n.includes('ذكر') || n.includes('male');
    const female = n.includes('female') || n.includes('أنثى') || n.includes('female');
    if (female) return `${v.name} (${t('readTexts.female')})`;
    if (male) return `${v.name} (${t('readTexts.male')})`;
    return v.name || v.lang;
  };

  return (
    <div className="space-y-6 pb-12" data-testid="read-texts-page">
      <AnimatedSection variant="fadeUp">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            {t('readTexts.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t('readTexts.subtitle')}
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection variant="fadeUp" delay={1}>
        <Card className="rounded-2xl sm:rounded-[2rem] border shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('readTexts.pasteOrUpload')}
            </CardTitle>
            <CardDescription>
              {t('readTexts.uploadHint')}
              <span className="block mt-1 text-xs opacity-90">{t('readTexts.qualityNote')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="min-h-[200px] resize-y font-medium text-base"
                placeholder={t('readTexts.placeholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex flex-col gap-2 shrink-0">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  id="tts-file"
                  onChange={handleFileSelect}
                  disabled={isExtracting}
                />
                <Label htmlFor="tts-file" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => document.getElementById('tts-file')?.click()}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isExtracting ? t('readTexts.extracting') : t('readTexts.uploadFile')}
                  </Button>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleTashkeel}
                  disabled={isTashkeel || !text.trim()}
                  title={t('readTexts.addTashkeelHint')}
                >
                  {isTashkeel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                  {t('readTexts.addTashkeel')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>{t('readTexts.language')}</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('readTexts.voiceType')}</Label>
                <Select value={useAiVoice ? 'ai' : 'browser'} onValueChange={(v) => setUseAiVoice(v === 'ai')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">{t('readTexts.voiceTypeAi')}</SelectItem>
                    <SelectItem value="browser">{t('readTexts.voiceTypeBrowser')}</SelectItem>
                  </SelectContent>
                </Select>
                {useAiVoice && !aiAvailable && (
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'صوت الذكاء الاصطناعي. اضبط GROQ_API_KEY في السيرفر.' : 'AI voice. Set GROQ_API_KEY in server.'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('readTexts.voice')}</Label>
                {useAiVoice ? (
                  <Select value={aiVoiceId} onValueChange={setAiVoiceId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(aiVoicesList.length ? aiVoicesList : [{ id: 'autumn', name: 'Autumn', gender: 'female' }, { id: 'austin', name: 'Austin', gender: 'male' }]).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.gender === 'female' ? t('readTexts.female') : v.gender === 'male' ? t('readTexts.male') : '—'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={voiceId || (filteredVoices[0]?.voiceURI ?? '')} onValueChange={setVoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('readTexts.voice')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVoices.length === 0 ? (
                        <SelectItem value="_none" disabled>{t('readTexts.noVoice')}</SelectItem>
                      ) : (
                        filteredVoices.map((v) => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI}>{voiceLabel(v)}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('readTexts.speed')}: {rate.toFixed(1)}x</Label>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[rate]}
                  onValueChange={([v]) => setRate(v)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
                {!isPlaying && !isPaused && (
                  <Button className="gap-2" onClick={handlePlay} disabled={isGenerating || (useAiVoice && !aiAvailable)}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('readTexts.generating')}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {t('readTexts.play')}
                      </>
                    )}
                  </Button>
                )}
                {isPlaying && (
                  <Button variant="outline" className="gap-2" onClick={isPaused ? handleResume : handlePause}>
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        {t('readTexts.resume')}
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        {t('readTexts.pause')}
                      </>
                    )}
                  </Button>
                )}
                {(isPlaying || isPaused) && (
                  <Button variant="outline" className="gap-2" onClick={handleStop}>
                    <Square className="w-4 h-4" />
                    {t('readTexts.stop')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
}
