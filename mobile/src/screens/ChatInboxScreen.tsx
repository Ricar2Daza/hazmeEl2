import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Avatar, Button, Divider, List, Searchbar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../lib/axios';
import { COLORS } from '../constants';
import { useAuthStore } from '../store/authStore';
import type { ChatConversation } from '../types';

const ChatInboxScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);
  const [search, setSearch] = useState('');
  const { data = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['chatConversations'],
    queryFn: async () => {
      const response = await chatApi.conversations();
      return response.data.data as ChatConversation[];
    },
  });

  const conversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return data;
    return data.filter((item) => {
      const peer = item.applicantId === userId
        ? item.job.publisher.fullName
        : item.applicant.fullName;
      return `${peer} ${item.job.title} ${item.chatMessages[0]?.content || ''}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [data, search, userId]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Searchbar
        placeholder="Buscar persona o trabajo"
        value={search}
        onChangeText={setSearch}
        style={{ margin: 12, backgroundColor: COLORS.white }}
      />
      {isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.danger, textAlign: 'center', marginBottom: 12 }}>No se pudieron cargar tus conversaciones.</Text>
          <Button mode="outlined" onPress={() => refetch()}>Reintentar</Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshing={isLoading || isRefetching}
          onRefresh={refetch}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          ListEmptyComponent={(
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <Avatar.Icon icon="message-text-outline" size={56} style={{ backgroundColor: COLORS.gray100 }} color={COLORS.gray500} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: COLORS.gray800 }}>Aún no tienes conversaciones</Text>
              <Text style={{ marginTop: 6, color: COLORS.gray500, textAlign: 'center' }}>
                Contacta desde una postulación o abre el chat con uno de tus postulantes.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const peer = item.applicantId === userId
              ? item.job.publisher.fullName
              : item.applicant.fullName;
            const preview = item.chatMessages[0]?.content || 'Inicia la conversación';
            return (
              <List.Item
                title={peer}
                description={`${item.job.title}\n${preview}`}
                titleNumberOfLines={1}
                descriptionNumberOfLines={2}
                left={(props) => <Avatar.Text {...props} size={44} label={peer.slice(0, 1).toUpperCase()} style={{ backgroundColor: COLORS.primary + '20' }} color={COLORS.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Chat', { applicationId: item.id })}
                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white }}
              />
            );
          }}
        />
      )}
    </View>
  );
};

export default ChatInboxScreen;