import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants';
import { jobsApi, applicationsApi, notificationsApi } from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';
import { ScreenContainer, JobCard, EmptyState, AppSnackbar, SnackState } from '../components/Shared';
import type { Job } from '../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const unreadCount = useNotifStore((s) => s.unreadCount);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data: mine, isLoading: loadingMine, refetch: refetchMine } = useQuery({
    queryKey: ['jobs', 'mine'],
    queryFn: async () => {
      const r = await jobsApi.mine();
      return r.data.data as Job[];
    },
  });

  const { data: myApps, isLoading: loadingApps, refetch: refetchApps } = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: async () => {
      const r = await applicationsApi.mine();
      return r.data.data as any[];
    },
  });

  const { data: recent, isLoading: loadingRecent } = useQuery({
    queryKey: ['jobs', 'recent'],
    queryFn: async () => {
      const r = await jobsApi.list({ limit: 5, sortBy: 'createdAt' });
      return (r.data?.data as Job[]) || [];
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetchMine();
      refetchApps();
      notificationsApi.unreadCount()
        .then((r) => setUnreadCount(r.data.count || 0))
        .catch(() => {});
    }, [])
  );

  const stats = [
    {
      label: 'Mis Publicaciones',
      value: mine?.length || 0,
      icon: 'briefcase-outline',
      color: COLORS.primary,
      bg: COLORS.primary + '15',
      onPress: () => navigation.navigate('MisCosas' as never),
    },
    {
      label: 'Mis Postulaciones',
      value: myApps?.length || 0,
      icon: 'send-outline',
      color: COLORS.tertiary,
      bg: COLORS.tertiary + '15',
      onPress: () => navigation.navigate('MisCosas' as never),
    },
    {
      label: 'Notificaciones',
      value: unreadCount,
      icon: 'notifications-outline',
      color: COLORS.warning,
      bg: COLORS.warning + '15',
      onPress: () => navigation.getParent()?.navigate('Notifications' as any),
    },
    {
      label: 'Publicar nuevo',
      value: '+',
      icon: 'add-circle-outline',
      color: COLORS.success,
      bg: COLORS.success + '15',
      onPress: () => navigation.navigate('Publicar' as never),
    },
  ];

  const goBuscar = () => navigation.navigate('Buscar' as never);
  const goPublicar = () => navigation.navigate('Publicar' as never);

  return (
    <ScreenContainer
      loading={loadingMine && loadingApps && loadingRecent && !mine && !myApps && !recent}
      onRefresh={async () => {
        await Promise.all([refetchMine(), refetchApps(), queryClient.invalidateQueries({ queryKey: ['jobs', 'recent'] })]);
      }}
      refreshing={false}
    >
      <View style={styles.welcome}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hi}>¡Hola! 👋</Text>
          <Text style={styles.name} numberOfLines={1}>{user?.fullName || 'Usuario'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Notifications' as any)}
          style={styles.notifBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.gray700} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {stats.map((s, i) => (
          <TouchableOpacity key={i} activeOpacity={0.7} style={[styles.card, { backgroundColor: s.bg }]} onPress={s.onPress}>
            <View style={[styles.iconBox, { backgroundColor: s.color + '20' }]}>
              <Ionicons name={s.icon as any} size={24} color={s.color} />
            </View>
            <Text style={[styles.cardValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.cardLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickRow}>
        <Button
          mode="contained"
          icon="magnify"
          style={[styles.quickBtn, { flex: 1, marginRight: 8, backgroundColor: COLORS.primary }]}
          onPress={goBuscar}
        >
          Buscar trabajos
        </Button>
        <Button
          mode="contained"
          icon="plus"
          style={[styles.quickBtn, { flex: 1, marginLeft: 8, backgroundColor: COLORS.success }]}
          onPress={goPublicar}
        >
          Publicar
        </Button>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trabajos recientes</Text>
        <TouchableOpacity onPress={goBuscar}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {!recent || recent.length === 0 ? (
        <EmptyState message="No hay trabajos publicados aún" icon="briefcase-outline" />
      ) : (
        recent.map((j) => (
          <JobCard
            key={j.id}
            job={j}
            onPress={() => navigation.getParent()?.navigate('JobDetail', { jobId: j.id })}
          />
        ))
      )}

      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  hi: { color: COLORS.gray500, fontSize: 14 },
  name: { color: COLORS.gray800, fontSize: 22, fontWeight: '800' },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeTxt: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  quickBtn: { borderRadius: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray800,
  },
});

export default HomeScreen;
