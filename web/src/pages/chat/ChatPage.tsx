import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '@/lib/axios';
import { getSocket, onSocketEvent } from '@/lib/socket';
import { onMqttTopic, publishMqtt, topics } from '@/lib/mqtt';
import { postReceipt } from '@/lib/receipts';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
}

interface Conversation {
  id: string;
  applicantId: string;
  applicant: { id: string; fullName: string };
  job: {
    id: string;
    title: string;
    status: string;
    publisher: { id: string; fullName: string };
  };
  chatMessages: ChatMessage[];
}

export default function ChatPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(getSocket()?.connected ?? false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef(0);

  const conversationsQuery = useQuery({
    queryKey: ['chatConversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const response = await chatApi.conversations();
      return response.data.data || [];
    },
    // Red de seguridad si el socket no está disponible.
    refetchInterval: 15000,
  });
  const conversation = conversationsQuery.data?.find((item) => item.id === applicationId);

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', applicationId],
    queryFn: async (): Promise<ChatMessage[]> => {
      const response = await chatApi.messages(applicationId!);
      return response.data.data || [];
    },
    enabled: !!applicationId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    return onSocketEvent('chat_message', (message: ChatMessage) => {
      if (message.applicationId === applicationId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', applicationId] });
        queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
      }
    });
  }, [applicationId, queryClient]);

  // Pub/sub MQTT por tópico (mismos eventos que el socket): mensajes,
  // recibos y tipado del hilo de esta postulación.
  useEffect(() => {
    if (!applicationId) return;
    const offMessages = onMqttTopic(topics.messages(applicationId), (_topic, payload) => {
      if (payload?.type !== 'message') return;
      queryClient.invalidateQueries({ queryKey: ['chatMessages', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    });
    const offReceipts = onMqttTopic(topics.receipts(applicationId), (_topic, payload) => {
      if (payload?.type !== 'receipt') return;
      queryClient.invalidateQueries({ queryKey: ['chatMessages', applicationId] });
    });
    return () => {
      offMessages();
      offReceipts();
    };
  }, [applicationId, queryClient]);

  // Indicador efímero de "escribiendo..." del interlocutor.
  useEffect(() => {
    if (!applicationId) return;
    const offTyping = onMqttTopic(topics.typing(applicationId), (_topic, payload) => {
      if (!payload || payload.userId === user?.id) return;
      setPeerTyping(true);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => setPeerTyping(false), 3500);
    });
    return () => {
      offTyping();
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      setPeerTyping(false);
    };
  }, [applicationId, user?.id]);

  // Recibo de lectura con el hilo abierto (idempotente en el servidor).
  useEffect(() => {
    if (!applicationId || !messagesQuery.data) return;
    const hasUnread = messagesQuery.data.some(
      (message) => message.senderId !== user?.id && !message.readAt
    );
    if (hasUnread) postReceipt('chat', applicationId, 'read');
  }, [applicationId, messagesQuery.data, user?.id]);

  useEffect(() => {
    // onSocketEvent engancha el listener aunque el socket todavía no exista
    // (en una recarga completa se crea después de montar los componentes).
    setSocketConnected(getSocket()?.connected ?? false);
    const offConnect = onSocketEvent('connect', () => setSocketConnected(true));
    const offDisconnect = onSocketEvent('disconnect', () => setSocketConnected(false));
    return () => {
      offConnect();
      offDisconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatApi.send(applicationId!, message),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo enviar el mensaje');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = content.trim();
    if (message && !sendMutation.isPending) sendMutation.mutate(message);
  };

  const messages = messagesQuery.data || [];
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return conversationsQuery.data || [];
    return (conversationsQuery.data || []).filter((item) => {
      const peerName = item.applicantId === user?.id
        ? item.job.publisher.fullName
        : item.applicant.fullName;
      return `${peerName} ${item.job.title} ${item.chatMessages[0]?.content || ''}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [conversationsQuery.data, search, user?.id]);
  const peer = conversation
    ? conversation.applicantId === user?.id
      ? conversation.job.publisher.fullName
      : conversation.applicant.fullName
    : 'Conversación';
  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  // Publica el indicador de tipado como máximo una vez cada 1,2 s.
  const handleComposerChange = (value: string) => {
    setContent(value);
    if (!applicationId || !user?.id) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;
    lastTypingSentRef.current = now;
    publishMqtt(topics.typing(applicationId), {
      type: 'typing',
      chatId: applicationId,
      userId: user.id,
      fullName: user.fullName,
      at: now,
    });
  };

  return (
    <section className="grid min-h-[calc(100dvh-10.75rem)] grid-cols-12 overflow-hidden rounded-lg border border-line bg-card sm:min-h-[calc(100dvh-11.5rem)] md:min-h-[calc(100dvh-7.5rem)]">
      <aside className={`${applicationId ? 'hidden lg:flex' : 'flex'} col-span-12 min-h-0 flex-col border-b border-line lg:col-span-4 lg:border-b-0 lg:border-r`}>
        <div className="shrink-0 border-b border-line px-5 py-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <MessageSquare className="h-5 w-5 text-accent-500" aria-hidden="true" />
            Mensajes
          </h1>
          <p className="mt-1 text-xs text-muted">Conversaciones sobre tus trabajos y postulaciones</p>
        </div>
        {conversationsQuery.isLoading ? (
          <p className="p-5 text-sm text-muted">Cargando conversaciones...</p>
        ) : conversationsQuery.isError ? (
          <div role="alert" className="p-5 text-sm text-red-700 dark:text-red-400">No se pudieron cargar tus conversaciones.</div>
        ) : conversationsQuery.data?.length ? (
          <>
            <div className="shrink-0 border-b border-line p-3">
              <label className="sr-only" htmlFor="conversation-search">Buscar conversaciones</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                <input
                  id="conversation-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar persona o trabajo"
                  className="input py-2 pl-9 text-sm"
                />
              </div>
            </div>
            <nav aria-label="Conversaciones" className="min-h-0 flex-1 overflow-y-auto">
            {filteredConversations.map((item) => {
              const name = item.applicantId === user?.id
                ? item.job.publisher.fullName
                : item.applicant.fullName;
              const latest = item.chatMessages[0]?.content || 'Aún no hay mensajes';
              return (
                <Link
                  key={item.id}
                  to={`/mensajes/${item.id}`}
                  aria-current={item.id === applicationId ? 'page' : undefined}
                  className={`block border-b border-line px-5 py-4 hover:bg-subtle ${item.id === applicationId ? 'border-l-2 border-l-accent-500 bg-subtle' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-semibold text-white">{name.charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                      <span className="mt-1 block truncate text-xs text-muted">{item.job.title}</span>
                      <span className="mt-2 block truncate text-sm text-ink-soft">{latest}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
            </nav>
            {!filteredConversations.length && <p className="p-4 text-sm text-muted">No hay coincidencias.</p>}
          </>
        ) : (
          <div className="p-5 text-sm text-ink-soft">
            <p>Aún no tienes conversaciones.</p>
            <Link to="/trabajos/buscar" className="mt-3 inline-block font-medium text-link hover:underline">
              Buscar trabajos
            </Link>
          </div>
        )}
      </aside>

      {applicationId && conversation ? (
        <div className="col-span-12 flex min-h-0 min-w-0 flex-col lg:col-span-8">
          <header className="shrink-0 border-b border-line px-5 py-4">
            <Link to="/mensajes" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline lg:hidden">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Todas las conversaciones
            </Link>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500 font-semibold text-white">{peer.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-ink">{peer}</h2>
                  <p className="mt-1 truncate text-sm text-muted">{conversation.job.title}</p>
                  {peerTyping && (
                    <p data-testid="peer-typing" className="mt-0.5 truncate text-xs italic text-accent-500">
                      Escribiendo…
                    </p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted">
                <span aria-hidden="true" className={`mr-1 inline-block h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-line-strong'}`} />
                {socketConnected ? 'En línea' : 'Reconectando'}
              </span>
            </div>
          </header>
          <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg p-5">
            {messagesQuery.isLoading ? (
              <p className="text-sm text-muted">Cargando mensajes...</p>
            ) : messagesQuery.isError ? (
              <div role="alert" className="text-sm text-red-700 dark:text-red-400">No se pudieron cargar los mensajes. Vuelve a intentarlo.</div>
            ) : messages.length ? messages.map((message) => {
              const own = message.senderId === user?.id;
              return (
                <div key={message.id} data-testid="chat-message" className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <article className={`max-w-[85%] rounded-lg border px-4 py-3 ${own ? 'border-primary-500 bg-primary-500 text-white' : 'border-line bg-card text-ink'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    <time className={`mt-1 block text-right text-[11px] ${own ? 'text-white/70' : 'text-muted'}`}>
                      {new Date(message.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                    {own && Boolean(message.readAt || message.deliveredAt) && (
                      <span
                        data-testid="message-receipt"
                        className="mt-0.5 block text-right text-[11px] text-white/70"
                      >
                        {message.readAt ? '✓✓ Leído' : '✓ Entregado'}
                      </span>
                    )}
                  </article>
                </div>
              );
            }) : (
              <p className="py-10 text-center text-sm text-muted">Inicia la conversación con {peer}.</p>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-3 border-t border-line bg-card p-4">
            <label className="sr-only" htmlFor="chat-message">Escribe un mensaje</label>
            <textarea
              id="chat-message"
              value={content}
              onChange={(event) => handleComposerChange(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              maxLength={2000}
              rows={2}
              placeholder="Escribe un mensaje... (Enter para enviar, Mayús+Enter para nueva línea)"
              className="input min-h-11 flex-1 resize-y"
            />
            <button type="submit" disabled={!content.trim() || sendMutation.isPending} className="btn-primary min-h-11 px-5">
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{sendMutation.isPending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </form>
        </div>
      ) : applicationId ? (
        <div className="col-span-12 flex min-h-0 items-center justify-center p-8 text-center text-sm text-ink-soft lg:col-span-8">
          {conversationsQuery.isLoading ? 'Cargando conversación...' : 'No tienes acceso a esta conversación o ya no existe.'}
        </div>
      ) : (
        <div className="hidden items-center justify-center p-8 text-center text-muted lg:col-span-8 lg:flex">
          Selecciona una conversación para ver los mensajes.
        </div>
      )}
    </section>
  );
}