import React, { useCallback, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, APPLICATION_STATUS_COLORS } from '../constants';
import { applicationsApi } from '../lib/axios';
import { ApplicationCard, EmptyState, AppSnackbar, SnackState } from '../components/Shared';
import type { Application } from '../types';

const MyPostulacionesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: async () => {
      const r = await applicationsApi.mine();
      return r.data.data as Application[];
    },
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const counts = {
    PENDIENTE: data?.filter((a) => a.status === 'PENDIENTE').length || 0,
    ACEPTADA: data?.filter((a) => a.status === 'ACEPTADA').length || 0,
    RECHAZADA: data?.filter((a) => a.status === 'RECHAZADA').length || 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, flexDirection: 'row', gap: 8 }}>
        {(['PENDIENTE', 'ACEPTADA', 'RECHAZADA'] as const).map((s) => (
          <Chip
            key={s}
            mode="flat"
            style={{ backgroundColor: APPLICATION_STATUS_COLORS[s] + '20', borderWidth: 0 }}
            textStyle={{ color: APPLICATION_STATUS_COLORS[s], fontWeight: '600' }}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
          </Chip>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            message="Aún no te has postulado a ningún trabajo"
            icon="send-outline"
            action={{
              label: 'Buscar trabajos',
              onPress: () => navigation.getParent()?.getParent()?.navigate('Buscar' as never),
            }}
          />
        }
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            onPress={() => item.job && navigation.getParent()?.getParent()?.navigate('JobDetail', { jobId: item.jobId })}
          />
        )}
      />
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </View>
  );
};

export default MyPostulacionesScreen;
