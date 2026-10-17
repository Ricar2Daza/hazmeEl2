import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Avatar, Button, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouteProp, useRoute } from '@react-navigation/native';
import { chatApi } from '../lib/axios';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants';
import type { ChatMessage } from '../types';
import type { ChatConversation } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const { applicationId } = useRoute<ChatRoute>().params;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [content, setContent] = useState('');

  const conversationsQuery = useQuery({
    queryKey: ['chatConversations'],
    queryFn: async () => {
      const response = await chatApi.conversations();
      return response.data.data as ChatConversation[];
    },
  });
  const conversation = conversationsQuery.data?.find((item) => item.id === applicationId);
  const messagesQuery = useQuery({
    queryKey: ['chatMessages', applicationId],
    queryFn: async () => {
      const response = await chatApi.messages(applicationId);
      return response.data.data as ChatMessage[];
    },
  });
  const messages = messagesQuery.data || [];
  const peer = conversation
    ? conversation.applicantId === userId
      ? conversation.job.publisher.fullName
      : conversation.applicant.fullName
    : 'Conversación';
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleMessage = (message: ChatMessage) => {
      if (message.applicationId === applicationId) {
        queryClient.setQueryData<ChatMessage[]>(['chatMessages', applicationId], (current: ChatMessage[] = []) =>
          current.some((item) => item.id === message.id) ? current : [...current, message]
        );
      }
    };
    socket.on('chat_message', handleMessage);
    return () => {
      socket.off('chat_message', handleMessage);
    };
  }, [applicationId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatApi.send(applicationId, message),
    onSuccess: (response) => {
      const message = response.data.data as ChatMessage;
      queryClient.setQueryData<ChatMessage[]>(['chatMessages', applicationId], (current: ChatMessage[] = []) =>
        current.some((item) => item.id === message.id) ? current : [...current, message]
      );
      setContent('');
      setSendError('');
    },
    onError: () => setSendError('No se pudo enviar el mensaje. Comprueba tu conexión e inténtalo de nuevo.'),
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Avatar.Text size={42} label={peer.slice(0, 1).toUpperCase()} style={{ backgroundColor: COLORS.primary + '20' }} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" numberOfLines={1} style={{ color: COLORS.gray900, fontWeight: '600' }}>{peer}</Text>
          <Text numberOfLines={1} style={{ color: COLORS.gray500 }}>{conversation?.job.title || 'Chat de trabajo'}</Text>
        </View>
      </View>
      {messagesQuery.isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.danger, textAlign: 'center', marginBottom: 12 }}>No se pudieron cargar los mensajes.</Text>
          <Button mode="outlined" onPress={() => messagesQuery.refetch()}>Reintentar</Button>
        </View>
      ) : messagesQuery.isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: messages.length ? 'flex-end' : 'center' }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.gray500 }}>Inicia la conversación sobre este trabajo.</Text>}
          renderItem={({ item }) => {
            const own = item.senderId === userId;
            return (
              <View style={{ alignSelf: own ? 'flex-end' : 'flex-start', maxWidth: '85%', marginVertical: 5, padding: 12, borderRadius: 14, backgroundColor: own ? COLORS.primary : COLORS.white }}>
                <Text style={{ color: own ? COLORS.white : COLORS.gray900 }}>{item.content}</Text>
                <Text style={{ alignSelf: 'flex-end', marginTop: 4, fontSize: 10, color: own ? COLORS.gray100 : COLORS.gray500 }}>
                  {new Date(item.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}
      {sendError ? <Text accessibilityRole="alert" style={{ paddingHorizontal: 16, color: COLORS.danger }}>{sendError}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: COLORS.white }}>
        <TextInput
          mode="outlined"
          label="Mensaje"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={2000}
          style={{ flex: 1, maxHeight: 120, backgroundColor: COLORS.white }}
        />
        <Button
          mode="contained"
          icon="send"
          accessibilityLabel="Enviar mensaje"
          disabled={!content.trim() || sendMutation.isPending}
          loading={sendMutation.isPending}
          onPress={() => sendMutation.mutate(content.trim())}
        >
          Enviar
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;