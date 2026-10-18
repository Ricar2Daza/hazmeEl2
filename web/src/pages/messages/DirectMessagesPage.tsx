import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { directApi } from '@/lib/axios';
import { getSocket, onSocketEvent } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string };
}

interface DirectConversation {
  id: string;
  updatedAt: string;
  other: { id: string; fullName: string; companyName?: string | null };
  lastMessage: DirectMessage | null;
}

export default function DirectMessagesPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ['directConversations'],
    queryFn: async (): Promise<DirectConversation[]> => {
      const response = await directApi.conversations();
      return response.data.data || [];
    },
  });

  const conversation = conversationsQuery.data?.find((item) => item.id === conversationId);

  const messagesQuery = useQuery({
    queryKey: ['directMessages', conversationId],
    queryFn: async (): Promise<DirectMessage[]> => {
      const response = await directApi.messages(conversationId!);
      return response.data.data || [];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    return onSocketEvent('direct_message', (message: DirectMessage) => {
      if (message.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['directMessages', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['directConversations'] });
    });
  }, [conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => directApi.send(conversationId!, message),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['directMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['directConversations'] });
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

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const messages = messagesQuery.data || [];
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return conversationsQuery.data || [];
    return (conversationsQuery.data || []).filter((item) =>
      `${item.other.fullName} ${item.other.companyName || ''} ${item.lastMessage?.content || ''}`
        .toLocaleLowerCase()
        .includes(needle)
    );
  }, [conversationsQuery.data, search]);

  const peer = conversation?.other.fullName || 'Conversación';

  return (
    <section className="grid min-h-[calc(100dvh-10.75rem)] grid-cols-12 overflow-hidden rounded-lg border border-line bg-card sm:min-h-[calc(100dvh-11.5rem)] md:min-h-[calc(100dvh-7.5rem)]">
      <aside
        className={`${
          conversationId ? 'hidden lg:flex' : 'flex'
        } col-span-12 min-h-0 flex-col border-b border-line lg:col-span-4 lg:border-b-0 lg:border-r`}
      >
        <div className="shrink-0 border-b border-line px-5 py-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Users className="h-5 w-5 text-accent-500" aria-hidden="true" />
            Mensajes directos
          </h1>
          <p className="mt-1 text-xs text-muted">Chats con cualquier persona de la plataforma</p>
        </div>

        {conversationsQuery.isLoading ? (
          <p className="p-5 text-sm text-muted">Cargando conversaciones...</p>
        ) : conversationsQuery.isError ? (
          <div role="alert" className="p-5 text-sm text-red-700 dark:text-red-400">
            No se pudieron cargar tus conversaciones.
          </div>
        ) : conversationsQuery.data?.length ? (
          <>
            <div className="shrink-0 border-b border-line p-3">
              <label className="sr-only" htmlFor="direct-search">
                Buscar conversaciones
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder"
                  aria-hidden="true"
                />
                <input
                  id="direct-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar persona"
                  className="input py-2 pl-9 text-sm"
                />
              </div>
            </div>

            <nav aria-label="Conversaciones directas" className="min-h-0 flex-1 overflow-y-auto">
              {filteredConversations.map((item) => (
                <Link
                  key={item.id}
                  to={`/mensajes-directos/${item.id}`}
                  aria-current={item.id === conversationId ? 'page' : undefined}
                  className={`block border-b border-line px-5 py-4 hover:bg-subtle ${
                    item.id === conversationId ? 'border-l-2 border-l-accent-500 bg-subtle' : ''
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                      {item.other.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.other.fullName}
                      </span>
                      <span className="mt-1 block truncate text-sm text-ink-soft">
                        {item.lastMessage?.content || 'Aún no hay mensajes'}
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
              {!filteredConversations.length && (
                <p className="p-4 text-sm text-muted">No hay coincidencias.</p>
              )}
            </nav>
          </>
        ) : (
          <div className="p-5 text-sm text-ink-soft">
            <p>Aún no tienes mensajes directos.</p>
            <p className="mt-2">
              Encuentra personas en{' '}
              <Link to="/usuarios" className="font-medium text-link hover:underline">
                Buscar personas
              </Link>{' '}
              y pulsa <em>Enviar mensaje</em> desde su perfil.
            </p>
          </div>
        )}
      </aside>

      {conversationId && conversation ? (
        <div className="col-span-12 flex min-h-0 min-w-0 flex-col lg:col-span-8">
          <header className="shrink-0 border-b border-line px-5 py-4">
            <Link
              to="/mensajes-directos"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Todas las conversaciones
            </Link>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500 font-semibold text-white">
                {peer.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-ink">{peer}</h2>
                <Link
                  to={`/usuarios/${conversation.other.id}`}
                  className="mt-0.5 inline-block truncate text-sm text-link hover:underline"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          </header>

          <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg p-5">
            {messagesQuery.isLoading ? (
              <p className="text-sm text-muted">Cargando mensajes...</p>
            ) : messagesQuery.isError ? (
              <div role="alert" className="text-sm text-red-700 dark:text-red-400">
                No se pudieron cargar los mensajes. Vuelve a intentarlo.
              </div>
            ) : messages.length ? (
              messages.map((message) => {
                const own = message.senderId === user?.id;
                return (
                  <div key={message.id} data-testid="direct-message" className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                    <article
                      className={`max-w-[85%] rounded-lg border px-4 py-3 ${
                        own ? 'border-primary-500 bg-primary-500 text-white' : 'border-line bg-card text-ink'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      <time
                        className={`mt-1 block text-right text-[11px] ${own ? 'text-white/70' : 'text-muted'}`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </article>
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted">
                Inicia la conversación con {peer}.
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-3 border-t border-line bg-card p-4">
            <label className="sr-only" htmlFor="direct-message-input">
              Escribe un mensaje
            </label>
            <textarea
              id="direct-message-input"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              maxLength={2000}
              rows={2}
              placeholder="Escribe un mensaje... (Enter para enviar, Mayús+Enter para nueva línea)"
              className="input min-h-11 flex-1 resize-y"
            />
            <button
              type="submit"
              disabled={!content.trim() || sendMutation.isPending}
              className="btn-primary min-h-11 px-5"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{sendMutation.isPending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </form>
        </div>
      ) : conversationId ? (
        <div className="col-span-12 flex min-h-0 items-center justify-center p-8 text-center text-sm text-ink-soft lg:col-span-8">
          {conversationsQuery.isLoading
            ? 'Cargando conversación...'
            : 'No tienes acceso a esta conversación o ya no existe.'}
        </div>
      ) : (
        <div className="hidden items-center justify-center p-8 text-center text-muted lg:col-span-8 lg:flex">
          Selecciona una conversación para ver los mensajes.
        </div>
      )}
    </section>
  );
}
