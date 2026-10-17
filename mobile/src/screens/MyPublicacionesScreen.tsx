import React, { useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants';
import { jobsApi } from '../lib/axios';
import { JobCard, EmptyState, AppSnackbar, SnackState } from '../components/Shared';
import { useState } from 'react';
import type { Job } from '../types';

const MyPublicacionesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', 'mine'],
    queryFn: async () => {
      const r = await jobsApi.mine();
      return r.data.data as Job[];
    },
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const cancelMut = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      setSnack({ visible: true, message: 'Trabajo cancelado', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: any) => setSnack({ visible: true, message: e?.response?.data?.message || 'Error', type: 'error' }),
  });

  const confirmCancel = (id: string, title: string) =>
    Alert.alert('Cancelar trabajo', `¿Deseas cancelar "${title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMut.mutate(id) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            message="Aún no has publicado ningún trabajo"
            icon="briefcase-outline"
            action={{
              label: 'Publicar mi primer trabajo',
              onPress: () => navigation.getParent()?.getParent()?.navigate('Publicar' as never),
            }}
          />
        }
        renderItem={({ item }) => (
          <View>
            <JobCard
              job={item}
              showAppCount
              onPress={() => navigation.getParent()?.getParent()?.navigate('JobDetail', { jobId: item.id })}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 12 }}>
              <Button
                mode="contained"
                compact
                style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.primary }}
                onPress={() => navigation.getParent()?.getParent()?.navigate('ManageApplicants', { jobId: item.id })}
              >
                Gestionar postulantes
              </Button>
              {item.status === 'ABIERTO' && (
                <Button
                  mode="outlined"
                  compact
                  textColor={COLORS.danger}
                  style={{ flex: 1, borderRadius: 10, borderColor: COLORS.danger }}
                  onPress={() => confirmCancel(item.id, item.title)}
                >
                  Cancelar
                </Button>
              )}
            </View>
          </View>
        )}
      />
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </View>
  );
};

export default MyPublicacionesScreen;
