import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants';
import { notificationsApi } from '../lib/axios';
import { useNotifStore } from '../store/notifStore';
import { EmptyState, AppSnackbar, SnackState } from '../components/Shared';
import type { Notification } from '../types';

const iconForType: Record<string, string> = {
  NEW_APPLICATION: 'person-add-outline',
  APPLICATION_ACCEPTED: 'checkmark-circle-outline',
  APPLICATION_REJECTED: 'close-circle-outline',
  JOB_UPDATED: 'refresh-outline',
};

const colorForType: Record<string, string> = {
  NEW_APPLICATION: COLORS.primary,
  APPLICATION_ACCEPTED: COLORS.success,
  APPLICATION_REJECTED: COLORS.danger,
  JOB_UPDATED: COLORS.warning,
};

const NotificationsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await notificationsApi.list({ limit: 100 });
      return (r.data?.data as Notification[]) || [];
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      notificationsApi.unreadCount()
        .then((r) => setUnreadCount(r.data.count || 0))
        .catch(() => {});
    }, [])
  );

  const readMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      notificationsApi.unreadCount()
        .then((r) => setUnreadCount(r.data.count || 0))
        .catch(() => {});
    },
  });

  const readAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSnack({ visible: true, message: 'Todas marcadas como leídas', type: 'success' });
      setUnreadCount(0);
    },
  });

  const unreadCount = data?.filter((n) => !n.read).length || 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={{ color: COLORS.gray600, flex: 1 }}>
            {unreadCount} notificación(es) sin leer
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => readAllMut.mutate()}
            loading={readAllMut.isPending}
            disabled={readAllMut.isPending}
          >
            Marcar todas leídas
          </Button>
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState message="No tienes notificaciones aún" icon="notifications-outline" />
        }
        renderItem={({ item }) => {
          const color = colorForType[item.type] || COLORS.primary;
          const icon = iconForType[item.type] || 'notifications-outline';
          return (
            <TouchableOpacity
              onPress={() => {
                if (!item.read) readMut.mutate(item.id);
              }}
              activeOpacity={0.7}
            >
              <Card
                mode="outlined"
                style={[styles.card, !item.read && { borderLeftWidth: 4, borderLeftColor: color }]}
              >
                <Card.Content style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon as any} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '700', color: COLORS.gray800, flex: 1, marginRight: 8 }}>
                        {item.title}
                      </Text>
                      {!item.read && <Chip mode="flat" style={{ height: 22 }} textStyle={{ fontSize: 10 }}>Nueva</Chip>}
                    </View>
                    <Text style={{ color: COLORS.gray600, marginTop: 4, lineHeight: 18 }}>
                      {item.message}
                    </Text>
                    <Text style={{ color: COLORS.gray400, fontSize: 11, marginTop: 6 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  card: {
    marginBottom: 10,
    borderRadius: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationsScreen;
