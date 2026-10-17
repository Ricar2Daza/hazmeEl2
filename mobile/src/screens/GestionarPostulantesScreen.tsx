import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, APPLICATION_STATUS_COLORS } from '../constants';
import { applicationsApi, jobsApi } from '../lib/axios';
import { ApplicationCard, EmptyState, AppSnackbar, SnackState } from '../components/Shared';
import type { Application } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RProps = RouteProp<RootStackParamList, 'ManageApplicants'>;

const GestionarPostulantesScreen: React.FC = () => {
  const route = useRoute<RProps>();
  const { jobId } = route.params;
  const queryClient = useQueryClient();
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job', jobId, 'applications'],
    queryFn: async () => {
      const r = await jobsApi.applications(jobId);
      return r.data.data as Application[];
    },
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => applicationsApi.accept(id),
    onSuccess: () => {
      setSnack({ visible: true, message: 'Postulación aceptada', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['job', jobId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
    onError: (e: any) => setSnack({ visible: true, message: e?.response?.data?.message || 'Error', type: 'error' }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => applicationsApi.reject(id),
    onSuccess: () => {
      setSnack({ visible: true, message: 'Postulación rechazada', type: 'info' });
      queryClient.invalidateQueries({ queryKey: ['job', jobId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
    onError: (e: any) => setSnack({ visible: true, message: e?.response?.data?.message || 'Error', type: 'error' }),
  });

  const confirmAccept = (id: string) =>
    Alert.alert('Aceptar postulación', '¿Deseas aceptar esta postulación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aceptar', onPress: () => acceptMut.mutate(id) },
    ]);
  const confirmReject = (id: string) =>
    Alert.alert('Rechazar postulación', '¿Deseas rechazar esta postulación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', onPress: () => rejectMut.mutate(id), style: 'destructive' },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1, paddingBottom: 40 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={() => (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.total}>
              Total: {(data?.length || 0)} postulante(s)
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState message="Aún no hay postulantes para este trabajo" icon="account-group-outline" />
        }
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            actions={
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  mode="contained"
                  compact
                  buttonColor={COLORS.success}
                  loading={acceptMut.isPending}
                  disabled={item.status !== 'PENDIENTE' || acceptMut.isPending}
                  style={{ flex: 1, borderRadius: 10 }}
                  onPress={() => confirmAccept(item.id)}
                >
                  Aceptar
                </Button>
                <Button
                  mode="outlined"
                  compact
                  textColor={COLORS.danger}
                  loading={rejectMut.isPending}
                  disabled={item.status !== 'PENDIENTE' || rejectMut.isPending}
                  style={{ flex: 1, borderRadius: 10, borderColor: COLORS.danger }}
                  onPress={() => confirmReject(item.id)}
                >
                  Rechazar
                </Button>
              </View>
            }
          />
        )}
      />
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </View>
  );
};

const styles = StyleSheet.create({
  total: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '600',
  },
});

export default GestionarPostulantesScreen;
