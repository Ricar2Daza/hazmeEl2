import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, CATEGORIES_DEFAULT } from '../constants';
import { jobsApi, categoriesApi } from '../lib/axios';
import { jobCreateSchema, JobCreateForm } from '../lib/zodSchemas';
import { AppSnackbar, SnackState } from '../components/Shared';
import type { Category } from '../types';

const PublishJobScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { data: categories = CATEGORIES_DEFAULT } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const r = await categoriesApi.list();
        return r.data.data as Category[];
      } catch {
        return CATEGORIES_DEFAULT;
      }
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<JobCreateForm>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      locationAddress: '',
      locationLat: 0,
      locationLng: 0,
      budgetMin: 0,
      budgetMax: 0,
      deadlineDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      categoryId: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: JobCreateForm) => {
      const payload = { ...data, deadlineDate: data.deadlineDate.toISOString() };
      return jobsApi.create(payload);
    },
    onSuccess: () => {
      setSnack({ visible: true, message: '¡Trabajo publicado exitosamente!', type: 'success' });
      reset();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error al publicar';
      setSnack({ visible: true, message: msg, type: 'error' });
    },
  });

  const onSubmit = (d: JobCreateForm) => mutation.mutate(d);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Publicar nuevo trabajo</Text>
        <Text style={styles.subtitle}>Describe qué necesitas y encuentra al profesional ideal</Text>

        <View style={styles.field}>
          <Text style={styles.lbl}>Título *</Text>
          <Controller control={control} name="title" render={({ field }) => (
            <>
              <TextInput
                mode="outlined"
                placeholder="Ej: Reparar techo de casa"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.title}
              />
              {errors.title && <HelperText type="error">{errors.title.message}</HelperText>}
            </>
          )} />
        </View>

        <View style={styles.field}>
          <Text style={styles.lbl}>Descripción *</Text>
          <Controller control={control} name="description" render={({ field }) => (
            <>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={5}
                placeholder="Describe detalladamente el trabajo..."
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.description}
                style={{ textAlignVertical: 'top' }}
              />
              {errors.description && <HelperText type="error">{errors.description.message}</HelperText>}
            </>
          )} />
        </View>

        <View style={styles.field}>
          <Text style={styles.lbl}>Categoría *</Text>
          <View style={styles.pickerBox}>
            <Controller control={control} name="categoryId" render={({ field }) => (
              <Picker
                selectedValue={field.value}
                onValueChange={(v) => field.onChange(v)}
                style={{ height: 44 }}
              >
                <Picker.Item label="Selecciona una categoría" value="" />
                {categories.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            )} />
          </View>
          {errors.categoryId && <HelperText type="error">{(errors.categoryId as any).message}</HelperText>}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.lbl}>Presupuesto Mín. ($)</Text>
            <Controller control={control} name="budgetMin" render={({ field }) => (
              <>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={String(field.value || '')}
                  onChangeText={(v) => field.onChange(Number(v) || 0)}
                  error={!!errors.budgetMin}
                />
                {errors.budgetMin && <HelperText type="error">{(errors.budgetMin as any).message}</HelperText>}
              </>
            )} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.lbl}>Presupuesto Máx. ($)</Text>
            <Controller control={control} name="budgetMax" render={({ field }) => (
              <>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={String(field.value || '')}
                  onChangeText={(v) => field.onChange(Number(v) || 0)}
                  error={!!errors.budgetMax}
                />
                {errors.budgetMax && <HelperText type="error">{(errors.budgetMax as any).message}</HelperText>}
              </>
            )} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.lbl}>Fecha límite *</Text>
          <Controller control={control} name="deadlineDate" render={({ field }) => (
            <>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray500} />
                <Text style={{ flex: 1, marginLeft: 10, color: COLORS.gray800 }}>
                  {field.value ? field.value.toLocaleDateString() : 'Selecciona'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={field.value || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) field.onChange(date);
                  }}
                />
              )}
              {errors.deadlineDate && <HelperText type="error">{(errors.deadlineDate as any).message}</HelperText>}
            </>
          )} />
        </View>

        <View style={styles.field}>
          <Text style={styles.lbl}>Ubicación *</Text>
          <Controller control={control} name="locationAddress" render={({ field }) => (
            <>
              <TextInput
                mode="outlined"
                placeholder="Dirección, ciudad..."
                left={<TextInput.Icon icon="map-marker-outline" />}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.locationAddress}
              />
              {errors.locationAddress && <HelperText type="error">{errors.locationAddress.message}</HelperText>}
            </>
          )} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.lbl}>Latitud</Text>
            <Controller control={control} name="locationLat" render={({ field }) => (
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={String(field.value || '')}
                onChangeText={(v) => field.onChange(Number(v) || 0)}
              />
            )} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.lbl}>Longitud</Text>
            <Controller control={control} name="locationLng" render={({ field }) => (
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={String(field.value || '')}
                onChangeText={(v) => field.onChange(Number(v) || 0)}
              />
            )} />
          </View>
        </View>
        <Text style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 20 }}>
          Nota: latitud y longitud se pueden dejar en 0 si no dispones de ellas.
        </Text>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          contentStyle={{ height: 50 }}
          style={{ borderRadius: 12 }}
        >
          Publicar Trabajo
        </Button>
      </ScrollView>
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  title: { fontWeight: '700', color: COLORS.gray800, marginBottom: 4 },
  subtitle: { color: COLORS.gray500, marginBottom: 20 },
  field: { marginBottom: 14 },
  lbl: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  pickerBox: { borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 8, overflow: 'hidden', backgroundColor: COLORS.white },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
});

export default PublishJobScreen;
