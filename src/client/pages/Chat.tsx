import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Search, CheckCheck, Smile, Paperclip,
  ArrowLeft, MessageCircle, LifeBuoy, X,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMessages, useThreadHistory, useWsEvent } from '@/hooks';
import { imageUploadSchema, replyMessageSchema } from '@/schemas/messages';
import { useHelpRequestStore } from '@/store/helpRequestStore';
import { useToastStore } from '@/store/toastStore';
import { CHAT_EMOJI_GROUPS } from '@/constants/chat';
import type { Thread, Message } from '@/types';
import { apiFetch } from '@/utils/api';
import { getPhoneNumber, displayPhone, isFromBot } from '@/utils';
import { cn } from '@/utils/cn';

const EMOJI_GROUPS = CHAT_EMOJI_GROUPS;

const fmtTime = (d: string) => {
  try {
    return format(new Date(d), 'HH:mm');
  } catch {
    return '--:--';
  }
};

const fmtDate = (d: string) => {
  try {
    const date = new Date(d);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return 'Fecha desconocida';
  }
};

export default function Chat() {
  const { addToast } = useToastStore();
  const { threads, sendReply } = useMessages();
  const [selectedThreadNumber, setSelectedThreadNumber] = useState<string | null>(null);
  const {
    messages: historyMessages,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    hasMore: historyHasMore,
    loadMore: historyLoadMore
  } = useThreadHistory(selectedThreadNumber);

  const helpRequests = useHelpRequestStore((s) => s.requests);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [botMuted, setBotMuted] = useState<Record<string, boolean>>({});
  const [botHelpId, setBotHelpId] = useState<Record<string, number | undefined>>({});
  const [botToggleLoading, setBotToggleLoading] = useState<Record<string, boolean>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const lastThreadRef = useRef<string | null>(null);

  const selectedThread = useMemo(() => {
    if (!selectedThreadNumber) return null;
    return threads.find((t) => t.number === selectedThreadNumber) || null;
  }, [threads, selectedThreadNumber]);

  const helpNumbers = useMemo(() => {
    const set = new Set<string>();
    helpRequests.forEach((r) => {
      const p = getPhoneNumber(r.phone_number);
      if (p) set.add(p);
    });
    return set;
  }, [helpRequests]);
  const hasHelpRequest = (phone: string) => helpNumbers.has(getPhoneNumber(phone));

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    apiFetch('/api/help-requests?includeMuted=1')
      .then((res) => res.json() as Promise<Array<{ phone_number: string; id: number }>>)
      .then((data) => {
        const muted: Record<string, boolean> = {};
        const ids: Record<string, number> = {};
        data.forEach((req) => {
          muted[req.phone_number] = true;
          ids[req.phone_number] = req.id;
        });
        setBotMuted(muted);
        setBotHelpId(ids);
      })
      .catch((err) => console.error('Error cargando solicitudes de ayuda:', err));
  }, []);

  useWsEvent('help:request', useCallback((data: unknown) => {
    const req = data as { phone_number: string; id: number };
    setBotMuted((p) => ({ ...p, [req.phone_number]: true }));
    setBotHelpId((p) => ({ ...p, [req.phone_number]: req.id }));
  }, []));

  useWsEvent('help:resolved', useCallback((data: unknown) => {
    const { id } = data as { id: number };
    setBotHelpId((prev) => {
      const phone = Object.entries(prev).find(([, v]) => v === id)?.[0];
      if (phone) {
        setBotMuted((p) => ({ ...p, [phone]: false }));
        const newIds = { ...prev };
        delete newIds[phone];
        return newIds;
      }
      return prev;
    });
  }, []));

  const handleSelectThread = (thread: Thread) => {
    setSelectedThreadNumber(thread.number);
    setMessageText('');
  };

  const toggleBotMuted = async (thread: Thread) => {
    const phone = thread.number;
    const isMuted = botMuted[phone];
    setBotToggleLoading((p) => ({ ...p, [phone]: true }));
    try {
      if (isMuted) {
        const id = botHelpId[phone];
        if (id) await apiFetch(`/api/help-requests/${id}/resolve`, { method: 'POST' });
        setBotMuted((p) => ({ ...p, [phone]: false }));
        setBotHelpId((p) => ({ ...p, [phone]: undefined }));
      } else {
        const res = await apiFetch('/api/help-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: phone,
            full_name: null,
            cedula: null,
            instance_id: thread.lastMsg.instance_id ?? undefined,
            silent: true,
          }),
        });
        const data = (await res.json()) as { id: number };
        setBotMuted((p) => ({ ...p, [phone]: true }));
        setBotHelpId((p) => ({ ...p, [phone]: data.id }));
      }
    } catch (err) {
      console.error('Error alternando bot:', err);
      addToast('No se pudo cambiar el estado del bot.', 'error');
    } finally {
      setBotToggleLoading((p) => ({ ...p, [phone]: false }));
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || sending || !messageText.trim()) return;
    const parsed = replyMessageSchema.safeParse({ message: messageText });
    if (!parsed.success) {
      addToast(parsed.error.issues[0]?.message ?? 'Mensaje invalido', 'error');
      return;
    }
    setSending(true);
    const result = await sendReply(
      selectedThread.number,
      parsed.data.message,
      selectedThread.lastMsg.instance_id ?? undefined
    );
    setSending(false);
    if (result.success) setMessageText('');
    else addToast(result.error ?? 'Error al enviar', 'error');
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const parsed = imageUploadSchema.safeParse(file);
      if (!parsed.success) {
        addToast(parsed.error.issues[0]?.message ?? 'Imagen invalida', 'error');
      } else {
        setImageFile(parsed.data);
      }
    }
    e.target.value = '';
  };

  const handleSendImage = async () => {
    if (!selectedThread || sending || !imageFile) return;
    setSending(true);
    const form = new FormData();
    form.append('phone', getPhoneNumber(selectedThread.number));
    form.append('image', imageFile);
    if (messageText.trim()) form.append('caption', messageText.trim());
    if (selectedThread.lastMsg.instance_id != null)
      form.append('instanceId', String(selectedThread.lastMsg.instance_id));
    try {
      const res = await apiFetch('/api/messages/reply-image', { method: 'POST', body: form });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) { setImageFile(null); setMessageText(''); }
      else addToast(data.error ?? 'Error al enviar imagen', 'error');
    } catch {
      addToast('Error de red al enviar imagen', 'error');
    } finally {
      setSending(false);
    }
  };

  const messagesWithDates = useMemo(() => {
    if (!selectedThread) return [];

    const flattened: (Message | { type: 'date'; date: string })[] = [];
    let lastDate = '';

    historyMessages.forEach(msg => {
      const d = fmtDate(msg.created_at);
      if (d !== lastDate) {
        lastDate = d;
        flattened.push({ type: 'date', date: d });
      }
      flattened.push(msg);
    });
    return flattened;
  }, [selectedThread, historyMessages]);

  const prevMsgsCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!selectedThread || messagesWithDates.length === 0) return;

    const threadNum = selectedThread.number;
    const isNewThread = threadNum !== lastThreadRef.current;
    const prevCount = prevMsgsCountRef.current[threadNum] ?? 0;
    const currentCount = historyMessages.length;

    const el = chatMessagesRef.current;
    if (el) {
      const isNewMessage = currentCount > prevCount && !isNewThread && !historyLoadingMore;

      if (isNewThread) {
        el.scrollTop = el.scrollHeight;
      } else if (isNewMessage) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      }
    }

    lastThreadRef.current = threadNum;
    prevMsgsCountRef.current[threadNum] = currentCount;
  }, [selectedThread?.number, messagesWithDates.length, historyLoadingMore]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        displayPhone(t.number).toLowerCase().includes(q) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q))
    );
  }, [threads, searchQuery]);

  const botMutedCurrent = selectedThread ? botMuted[selectedThread.number] : false;

  const threadListContent = (
    <>
      <div className="chat-search">
        <Search size={16} className="chat-search-icon" />
        <input
          type="text"
          placeholder="Buscar conversacion..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="chat-search-input"
        />
      </div>
      <div className="chat-list">
        {filteredThreads.length === 0 ? (
          <div className="chat-empty">
            <MessageCircle size={40} className="chat-empty-icon" />
            <p>No hay conversaciones</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.number}
              className={cn('chat-item', selectedThread?.number === thread.number && 'chat-item--active')}
              onClick={() => handleSelectThread(thread)}
            >
              <div className="chat-avatar">
                <span>{displayPhone(thread.number).slice(1, 3)}</span>
              </div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <span className="chat-item-name">{displayPhone(thread.number)}</span>
                  <span className="chat-item-time">{fmtTime(thread.lastMsg.created_at)}</span>
                </div>
                <div className="chat-item-preview">
                  {isFromBot(thread.lastMsg.from_number) && <CheckCheck size={12} className="chat-item-check" />}
                  <span className="chat-item-text">{thread.lastMsg.body}</span>
                </div>
              </div>
              {hasHelpRequest(thread.number) && (
                <span className="chat-item-status" title="Necesita ayuda">
                  <LifeBuoy size={14} />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );

  const conversationContent = selectedThread ? (
    <>
      <div className="chat-view-header">
        {isMobileView && (
          <button type="button" className="chat-back-btn" onClick={() => setSelectedThreadNumber(null)}>
            <ArrowLeft size={20} />
          </button>
        )}
        {!isMobileView && (
          <div className="chat-view-avatar">
            <span>{displayPhone(selectedThread.number).slice(1, 3)}</span>
          </div>
        )}
        <div className="chat-view-info">
          <span className="chat-view-name">{displayPhone(selectedThread.number)}</span>
          <span className="chat-view-status">
            {selectedThread.messages.length} mensaje{selectedThread.messages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="chat-view-actions">
          <button
            type="button"
            className={cn('chat-bot-toggle', botMutedCurrent ? 'off' : 'on')}
            onClick={() => toggleBotMuted(selectedThread)}
            title={botMutedCurrent ? 'Bot silenciado' : 'Bot activo'}
            disabled={botToggleLoading[selectedThread.number]}
          >
            <span>{botMutedCurrent ? 'Bot off' : 'Bot on'}</span>
            <span className="chat-bot-toggle__dot" />
          </button>
        </div>
      </div>
      <div className="chat-messages" ref={chatMessagesRef} onScroll={(e) => {
        const el = e.currentTarget;
        if (el.scrollTop <= 20 && selectedThread && historyHasMore && !historyLoadingMore) {
          const prevHeight = el.scrollHeight;
          historyLoadMore().then(() => {
            requestAnimationFrame(() => {
              const newHeight = el.scrollHeight;
              el.scrollTop = newHeight - prevHeight;
            });
          });
        }
      }}>
        {selectedThread && historyHasMore && (
          <button
            type="button"
            className="chat-load-more"
            disabled={historyLoadingMore}
            onClick={() => {
              const el = chatMessagesRef.current;
              const prevHeight = el?.scrollHeight ?? 0;
              historyLoadMore().then(() => {
                requestAnimationFrame(() => {
                  if (el) el.scrollTop = el.scrollHeight - prevHeight;
                });
              });
            }}
          >
            <span>{historyLoadingMore ? 'Cargando...' : 'Cargar mensajes anteriores'}</span>
          </button>
        )}
        {messagesWithDates.map((item, idx) => {
          const isDate = 'type' in item && item.type === 'date';
          if (isDate) {
            return (
              <div key={`date-${idx}`} className="chat-date-separator">
                <span>{(item as { date: string }).date}</span>
              </div>
            );
          }
          const msg = item as Message;
          return (
            <div
              key={msg.id}
              className={cn(
                'chat-bubble',
                isFromBot(msg.from_number) ? 'chat-bubble--sent' : 'chat-bubble--received'
              )}
            >
              <p className="chat-bubble-text">{msg.body}</p>
              <span className="chat-bubble-time">{fmtTime(msg.created_at)}</span>
            </div>
          );
        })}
      </div>
      <div className="chat-input-area">
        <div className="chat-emoji-wrapper" ref={emojiPickerRef}>
          <button type="button" className={cn('chat-input-btn', showEmojiPicker && 'chat-input-btn--active')} onClick={() => setShowEmojiPicker((v) => !v)}>
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="chat-emoji-picker">
              <div className="chat-emoji-picker-header">
                <span>Emojis</span>
                <button type="button" className="chat-emoji-close" onClick={() => setShowEmojiPicker(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="chat-emoji-scroll" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {EMOJI_GROUPS.map((group) => (
                  <div key={group.label} className="chat-emoji-group">
                    <span className="chat-emoji-group-label">{group.label}</span>
                    <div className="chat-emoji-grid">
                      {group.emojis.map((emoji) => (
                        <button key={emoji} type="button" className="chat-emoji-btn" onClick={() => handleEmojiSelect(emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="button" className="chat-input-btn" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
        {imageFile ? (
          <div className="chat-image-preview">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="chat-image-preview-thumb" />
            <span className="chat-image-preview-name">{imageFile.name}</span>
            <button type="button" className="chat-image-preview-remove" onClick={() => setImageFile(null)}>
              <X size={14} />
            </button>
            <input type="text" placeholder="Añadir descripcion..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendImage(); } }} className="chat-input" />
          </div>
        ) : (
          <input type="text" placeholder="Escribe un mensaje..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} className="chat-input" />
        )}
        <button type="button" className="chat-send-btn" onClick={imageFile ? handleSendImage : handleSendMessage} disabled={sending || (!imageFile && !messageText.trim())}>
          <Send size={18} />
        </button>
      </div>
    </>
  ) : null;

  const welcomeContent = (
    <div className="chat-welcome">
      <div className="chat-welcome-content">
        <div className="chat-welcome-icon"><MessageCircle size={80} strokeWidth={1} /></div>
        <h2 className="chat-welcome-title">WhatsApp Web</h2>
        <p className="chat-welcome-text">Envia y recibe mensajes sin necesidad de tener el telefono conectado.</p>
      </div>
    </div>
  );

  if (isMobileView) {
    return (
      <div className="chat-page">
        {!selectedThreadNumber ? (
          <div className="chat-list-mobile">
            <div className="chat-header-mobile"><h1 className="chat-title">Chats</h1></div>
            {threadListContent}
          </div>
        ) : (
          <div className="chat-view-mobile">{conversationContent}</div>
        )}
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-panel-left">
        <div className="chat-panel-header"><h1 className="chat-title">Chats</h1></div>
        {threadListContent}
      </div>
      <div className="chat-panel-right">{conversationContent || welcomeContent}</div>
    </div>
  );
}
