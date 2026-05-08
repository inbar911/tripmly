'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from './I18nProvider';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function ChatBot({
  systemPrompt,
  initialAssistantMessage,
  context,
  height = 560,
  autoSendMessage
}: {
  systemPrompt: string;
  initialAssistantMessage: string;
  context?: Record<string, any>;
  height?: number;
  autoSendMessage?: string;
}) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(
    autoSendMessage ? [] : [{ role: 'assistant', content: initialAssistantMessage }]
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sentAuto = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (autoSendMessage && !sentAuto.current) {
      sentAuto.current = true;
      send(autoSendMessage);
    }
  }, [autoSendMessage]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemPrompt, messages: [...messages, userMsg], context, lang })
      });
      const data = await res.json();
      const reply = data.reply || (data.error ? `⚠️ ${data.error}` : t('chat.unknown'));
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('chat.error') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" style={{ height }}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <span className="font-semibold">{t('chat.title')}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-800'}`}>
              {m.role === 'user' ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <div className="prose prose-sm max-w-none prose-a:text-brand-600 prose-a:underline prose-strong:text-slate-900 prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-base">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>
                    }}
                  >{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.15s' }} />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-100 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('chat.placeholder')} className="input" disabled={busy} />
        <button className="btn-primary !px-4" disabled={busy || !input.trim()} aria-label="send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
