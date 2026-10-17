import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, Chip, Card, Divider, TextInput, HelperText, Avatar } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, JOB_STATUS_COLORS, APPLICATION_STATUS_COLORS } from '../constants';
import { jobsApi } from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { applySchema, ApplyForm } from '../lib/zodSchemas';
import { AppSnackbar, SnackState, ScreenContainer } from '../components/Shared';
import type { Job, Application } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RProps = RouteProp<RootStackParamList, 'JobDetail'>;

const JobDetailScreen: React.FC = () => {
  const route = useRoute<RProps>();
  const { jobId } = route.params;
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });
  const [showApplyModal, setShowApplyModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const r = await jobsApi.getById(jobId);
      return r.data.data as Job;
    },
  });

  const applyMutation = useMutation({
    mutationFn: (d: ApplyForm) => jobsApi.apply(jobId, d),
    onSuccess: () => {
      setShowApplyModal(false);
      setSnack({ visible: true, message: '¡Postulación enviada!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error al postularse';
      setSnack({ visible: true, message: msg, type: 'error' });
    },
  });

  const isPublisher = data?.publisherId === me?.id;
  const myApp: Application | undefined = (data as any)?.myApplication;
  const budget = data && data.budgetMin === data.budgetMax
    ? `$${data.budgetMin}`
    : `$${data?.budgetMin} - $${data?.budgetMax}`;

  return (
    <ScreenContainer loading={isLoading && !data} withoutScroll>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {data && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{data.title}</Text>
              <Chip
                style={{ backgroundColor: `${JOB_STATUS_COLORS[data.status]}20`, borderWidth: 0 }}
                textStyle={{ color: JOB_STATUS_COLORS[data.status], fontSize: 12 }}
              >
                {data.status}
              </Chip>
            </View>
            {data.category?.name && (
              <Chip style={styles.catChip} textStyle={{ fontSize: 12 }}>{data.category.name}</Chip>
            )}

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text style={styles.h3}>Descripción</Text>
                <Text style={styles.desc}>{data.description}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Row icon="cash-outline" color={COLORS.success} label="Presupuesto" value={budget} />
                <Divider style={{ marginVertical: 10 }} />
                <Row icon="calendar-outline" color={COLORS.info} label="Fecha límite"
                  value={new Date(data.deadlineDate).toLocaleDateString()} />
                <Divider style={{ marginVertical: 10 }} />
                <Row icon="map-marker-outline" color={COLORS.danger} label="Ubicación" value={data.locationAddress} />
                <Divider style={{ marginVertical: 10 }} />
                <Row
                  icon="people-outline"
                  color={COLORS.primary}
                  label="Postulantes"
                  value={`${data._count?.applications || 0} personas`}
                />
              </Card.Content>
            </Card>

            {data.publisher && (
              <Card style={styles.card} mode="outlined">
                <Card.Content>
                  <Text style={styles.h3}>Publicado por</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Avatar.Text
                      size={48}
                      label={data.publisher.fullName.split(' ').map((x) => x[0]).slice(0, 2).join('')}
                      style={{ backgroundColor: COLORS.primary }}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: COLORS.gray800 }}>
                        {data.publisher.fullName}
                      </Text>
                      <Text style={{ color: COLORS.gray500, fontSize: 12 }}>{data.publisher.email}</Text>
                      {data.publisher.phone && (
                        <Text style={{ color: COLORS.gray500, fontSize: 12 }}>{data.publisher.phone}</Text>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {data && (
        <View style={styles.bottomBar}>
          {isPublisher ? (
            <>
              <Button
                mode="contained"
                icon="account-group"
                style={{ flex: 1, marginRight: 8, borderRadius: 10, backgroundColor: COLORS.primary }}
                onPress={() => navigation.navigate('ManageApplicants', { jobId: data.id })}
              >
                Gestionar ({data._count?.applications || 0})
              </Button>
              <Button
                mode="outlined"
                icon="pencil"
                style={{ flex: 1, borderRadius: 10 }}
                onPress={() => refetch()}
              >
                Editar
              </Button>
            </>
          ) : myApp ? (
            <Chip
              mode="flat"
              style={[styles.appliedChip, { backgroundColor: APPLICATION_STATUS_COLORS[myApp.status] + '20' }]}
              textStyle={{ color: APPLICATION_STATUS_COLORS[myApp.status], fontWeight: '700' }}
              icon={() => <Ionicons name="checkmark-circle" size={16} color={APPLICATION_STATUS_COLORS[myApp.status]} />}
            >
              Ya postulaste: {myApp.status}
            </Chip>
          ) : (
            <Button
              mode="contained"
              icon="send"
              style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.primary }}
              contentStyle={{ height: 50 }}
              onPress={() => setShowApplyModal(true)}
            >
              Postularme
            </Button>
          )}
        </View>
      )}

      <Modal visible={showApplyModal} animationType="slide" transparent onRequestClose={() => setShowApplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Postularse al trabajo</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray700} />
              </TouchableOpacity>
            </View>
            <ApplyFormComp
              onSubmit={(d) => applyMutation.mutate(d)}
              loading={applyMutation.isPending}
              onCancel={() => setShowApplyModal(false)}
            />
          </View>
        </View>
      </Modal>

      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScreenContainer>
  );
};

const Row: React.FC<{ icon: string; color: string; label: string; value: string }> = ({
  icon, color, label, value,
}) => (
  <View style={styles.rowItem}>
    <View style={[styles.rowIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const ApplyFormComp: React.FC<{
  onSubmit: (d: ApplyForm) => void;
  loading: boolean;
  onCancel: () => void;
}> = ({ onSubmit, loading, onCancel }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { message: '' },
  });
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: COLORS.gray600, marginBottom: 10, lineHeight: 20 }}>
        Cuéntale al publicador por qué eres la persona ideal para este trabajo (opcional).
      </Text>
      <Controller control={control} name="message" render={({ field }) => (
        <>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={5}
            placeholder="Mensaje al publicador..."
            value={field.value || ''}
            onChangeText={field.onChange}
            style={{ textAlignVertical: 'top' }}
            error={!!errors.message}
          />
          {errors.message && <HelperText type="error">{(errors.message as any).message}</HelperText>}
        </>
      )} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={onCancel}>Cancelar</Button>
        <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} loading={loading} disabled={loading} onPress={handleSubmit(onSubmit)}>
          Enviar
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.gray800 },
  catChip: { alignSelf: 'flex-start', backgroundColor: COLORS.gray100, marginBottom: 14 },
  card: { marginBottom: 14, borderRadius: 14 },
  h3: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, marginBottom: 8 },
  desc: { color: COLORS.gray600, lineHeight: 22 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: COLORS.gray500, fontSize: 12 },
  rowValue: { color: COLORS.gray800, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedChip: {
    flex: 1,
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray800 },
});

export default JobDetailScreen;
