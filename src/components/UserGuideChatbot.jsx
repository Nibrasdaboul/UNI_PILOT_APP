import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const WELCOME_AR = 'مرحباً! أنا مساعد دليل استخدام يوني بايلوت. اختر سؤالاً أدناه أو اكتب سؤالك.';
const WELCOME_EN = "Hi! I'm the UniPilot user guide assistant. Pick a question below or type your own.";

const PROMPTS_AR = [
  'كيف أضيف مقرراً دراسياً؟',
  'ما هي أدوات الدراسة وكيف أستخدمها؟',
  'كيف أستخدم الملخص والبطاقات التعليمية والاختبار؟',
  'أين أجد المخطط الدراسي وكيف أضيف أحداثاً؟',
  'كيف أسجل ملاحظاتي وأين تظهر؟',
  'ما الفرق بين المستشار الذكي ودليل المستخدم؟',
  'كيف أغير اللغة أو الإعدادات؟',
];

const PROMPTS_EN = [
  'How do I add a course?',
  'What are Study Tools and how do I use them?',
  'How do I use the summarizer, flashcards, and quiz?',
  'Where is the planner and how do I add events?',
  'How do I take notes and where do they appear?',
  'What is the difference between AI Coach and User Guide?',
  'How do I change language or settings?',
];

export function UserGuideChatbot() {
  const { api } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: isAr ? WELCOME_AR : WELCOME_EN },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages]);

  const sendQuestion = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const list = [...messages, userMsg].map((msg) => ({ role: msg.role, content: msg.content }));
      const res = await api.post('/ai/guide-chat', { messages: list, lang: isAr ? 'ar' : 'en' });
      const content = res.data?.content || (isAr ? 'عذراً، لم أتمكن من الإجابة.' : 'Sorry, I could not reply.');
      setMessages((m) => [...m, { role: 'assistant', content }]);
    } catch (e) {
      const err = e.response?.data?.detail || (isAr ? 'فشل الإرسال. جرّب لاحقاً.' : 'Send failed. Try again.');
      setMessages((m) => [...m, { role: 'assistant', content: err }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendQuestion(input);
  const prompts = isAr ? PROMPTS_AR : PROMPTS_EN;

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={cn(
          'fixed z-[60] rounded-full shadow-lg transition-transform hover:scale-105',
          'bottom-4 right-4 h-12 w-12 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14',
          isAr && 'right-auto left-4 sm:left-6'
        )}
        onClick={() => setOpen((o) => !o)}
        aria-label={isAr ? 'دليل المستخدم' : 'User guide'}
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:bg-black/30"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'fixed top-0 bottom-0 z-50 h-full w-[min(24rem,95vw)] max-w-[95vw] flex flex-col',
              'bg-background border shadow-2xl transition-transform duration-200 ease-out',
              'rounded-none sm:rounded-l-2xl',
              isAr ? 'left-0 border-r sm:rounded-r-2xl' : 'right-0 border-l sm:rounded-l-2xl'
            )}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between shrink-0 p-3 sm:p-4 border-b bg-muted/40">
              <span className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">{isAr ? 'دليل المستخدم' : 'User Guide'}</span>
              </span>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9" onClick={() => setOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-3 sm:p-4">
              <div className="space-y-3 pb-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm max-w-[92%] break-words',
                      msg.role === 'user'
                        ? isAr ? 'mr-0 ml-auto bg-primary text-primary-foreground' : 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-muted text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{isAr ? 'جاري الرد...' : 'Replying...'}</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="shrink-0 px-3 sm:px-4 pb-3 border-b overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? 'أسئلة مقترحة:' : 'Suggested questions:'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {prompts.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendQuestion(q)}
                      disabled={loading}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg border bg-muted/50 hover:bg-muted transition-colors',
                        'disabled:opacity-50 disabled:pointer-events-none text-start'
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

            <div className="shrink-0 p-3 sm:p-4 border-t flex gap-2 bg-background">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isAr ? 'اسأل عن أي ميزة...' : 'Ask about any feature...'}
                className="rounded-xl flex-1 min-w-0 text-sm"
                disabled={loading}
              />
              <Button size="icon" className="rounded-xl shrink-0 h-10 w-10" onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
