import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getMessages, sendReply as sendReplyRequest } from '@/services';
import type { Message, Thread } from '@/types';
import { getPhoneNumber, isFromBot } from '@/utils';
import { useToastStore } from '@/store/toastStore';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';

export function useThreadHistory(phone: string | null) {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 50;

  const query = useInfiniteQuery({
    queryKey: ['messages', 'history', phone],
    queryFn: ({ pageParam = 0 }) => 
      getMessages({ 
        contact: phone || undefined, 
        limit: PAGE_SIZE, 
        offset: pageParam * PAGE_SIZE 
      }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!phone,
    initialPageParam: 0,
  });

  // Revalidar cuando llegan nuevos mensajes por WS
  useWsEvent('messages:new', () => {
    if (phone) queryClient.invalidateQueries({ queryKey: ['messages', 'history', phone] });
  });

  const messages = useMemo(() => {
    return query.data?.pages.flat().reverse() || [];
  }, [query.data]);

  return {
    messages,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export function useMessages() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['messages'] });

  const query = useQuery({
    queryKey: ['messages', 'threads'],
    queryFn: () => getMessages({ mode: 'threads' }),
  });

  useWsEvent('messages:new', invalidate);
  useWsEvent('instances:changed', invalidate);

  const threads = useMemo(() => buildThreads(query.data ?? []), [query.data]);

  const mutation = useMutation({
    mutationFn: async ({ phone, message, instanceId }: { phone: string; message: string; instanceId?: number }) => {
      const cleanPhone = getPhoneNumber(phone);
      if (!cleanPhone) throw new Error('Numero de telefono invalido');
      if (!message.trim()) throw new Error('El mensaje no puede estar vacio');

      await sendReplyRequest({ phone: cleanPhone, message: message.trim(), instanceId });
    },
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Mensaje enviado correctamente', 'success');
    },
    onError: (error: Error) => {
      useToastStore.getState().addToast(error.message || 'Error al enviar mensaje', 'error');
    },
  });

  const sendReply = async (phone: string, message: string, instanceId?: number) => {
    try {
      await mutation.mutateAsync({ phone, message, instanceId });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error de red' };
    }
  };

  return {
    messages: query.data ?? [],
    threads,
    loading: query.isLoading,
    refetch: invalidate,
    sendReply,
  };
}

function buildThreads(messages: Message[]): Thread[] {
  const map = new Map<string, Message[]>();

  for (const message of messages) {
    const rawNumber = isFromBot(message.from_number) ? getPhoneNumber(message.from_number) : message.from_number;
    const number = rawNumber.trim();
    if (!map.has(number)) map.set(number, []);
    map.get(number)!.push(message);
  }

  return Array.from(map.entries())
    .map(([number, currentMessages]) => {
      const sortedMessages = [...currentMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return { number, messages: sortedMessages, lastMsg: sortedMessages[sortedMessages.length - 1] };
    })
    .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime());
}
