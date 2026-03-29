import { useEffect, useState } from 'react';
import { MESSAGES_PAGE_SIZE } from '@/constants/messages';
import type { Message } from '@/types';
import { useMessages } from '@/hooks';
import { replyMessageSchema } from '@/schemas/messages';
import { useToastStore } from '@/store/toastStore';

export function useMessagesPage() {
  const { messages, sendReply } = useMessages();
  const { addToast } = useToastStore();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((Array.isArray(messages) ? messages.length : 0) / MESSAGES_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageMessages = Array.isArray(messages) ? messages.slice((safePage - 1) * MESSAGES_PAGE_SIZE, safePage * MESSAGES_PAGE_SIZE) : [];

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleReplyStart = (messageId: number) => {
    setReplyingTo(messageId);
    setReplyText('');
  };

  const handleReplyCancel = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSendReply = async (message: Message) => {
    if (sending) return;
    const result = replyMessageSchema.safeParse({ message: replyText });
    if (!result.success) {
      addToast(result.error.issues[0]?.message ?? 'Mensaje invalido', 'error');
      return;
    }

    setSending(true);
    const replyResult = await sendReply(message.from_number, result.data.message, message.instance_id ?? undefined);
    setSending(false);

    if (replyResult.success) {
      handleReplyCancel();
      return;
    }

    addToast(replyResult.error ?? 'Error al enviar', 'error');
  };

  return {
    messages,
    pageMessages,
    replyingTo,
    replyText,
    setReplyText,
    sending,
    currentPage: safePage,
    totalPages,
    setCurrentPage,
    handleSendReply,
    handleReplyStart,
    handleReplyCancel,
  };
}
