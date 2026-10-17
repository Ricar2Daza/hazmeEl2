import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, Card, Chip, TextInput, Divider, Avatar, HelperText, List } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';
import { updateProfileSchema, UpdateProfileForm } from '../lib/zodSchemas';
import { AppSnackbar, SnackState } from '../components/Shared';
import { disconnectSocket } from '../lib/socket';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const update = useAuthStore((s) => s.updateProfile);
  const logoutStore = useAuthStore((s) => s.logout);
  const resetNotif = useNotifStore((s) => s.resetUnread);
  const unreadCount = useNotifStore((s) => s.unreadCount);
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const updateMut = useMutation({
    mutationFn: (d: UpdateProfileForm) => update(d),
    onSuccess: () => {
      setSnack({ visible: true, message: 'Perfil actualizado', type: 'success' });
      setEditOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (e: any) => setSnack({ visible: true, message: e?.response?.data?.message || 'Error', type: 'error' }),
  });

  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Estás seguro de querer cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          disconnectSocket();
          await logoutStore();
          resetNotif();
          queryClient.clear();
        },
      },
    ]);

  const initials = user?.fullName?.split(' ').map((x) => x[0]).slice(0, 2).join('') || 'U';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card style={styles.headerCard}>
        <Card.Content style={{ alignItems: 'center' }}>
          <Avatar.Text
            size={84}
            label={initials}
            style={{ backgroundColor: COLORS.primary, marginBottom: 14 }}
          />
          <Text variant="headlineSmall" style={{ fontWeight: '700', color: COLORS.gray800 }}>
            {user?.fullName || 'Usuario'}
          </Text>
          <Text style={{ color: COLORS.gray500, marginTop: 2 }}>{user?.email}</Text>
          {user?.phone && (
            <Text style={{ color: COLORS.gray600, marginTop: 2 }}>📱 {user.phone}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, width: '100%' }}>
            <Button
              mode="contained"
              icon="pencil"
              style={{ flex: 1, borderRadius: 10 }}
              onPress={() => setEditOpen(true)}
            >
              Editar
            </Button>
            <Button
              mode="outlined"
              icon="logout"
              textColor={COLORS.danger}
              style={{ flex: 1, borderRadius: 10, borderColor: COLORS.danger }}
              onPress={confirmLogout}
            >
              Cerrar sesión
            </Button>
          </View>
        </Card.Content>
      </Card>

      <List.Section style={{ marginTop: 4 }}>
        <List.Subheader>Mi información</List.Subheader>
        <Card mode="outlined" style={{ borderRadius: 12 }}>
          {user?.companyName && (
            <InfoRow icon="domain" label="Empresa" value={user.companyName} />
          )}
          {user?.bio && <InfoRow icon="information-outline" label="Biografía" value={user.bio} />}
          {typeof user?.experienceYears === 'number' && (
            <InfoRow icon="briefcase-outline" label="Experiencia" value={`${user.experienceYears} años`} />
          )}
          {user?.portfolioUrl && (
            <InfoRow icon="link-variant" label="Portafolio" value={user.portfolioUrl} />
          )}
          {user?.locationAddress && (
            <InfoRow icon="map-marker-outline" label="Ubicación" value={user.locationAddress} />
          )}
          {user?.skills && user.skills.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: COLORS.gray500, fontSize: 12, marginBottom: 6 }}>Habilidades</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {user.skills.map((s, i) => (
                  <Chip key={i} mode="flat" style={{ backgroundColor: COLORS.primary + '15' }} textStyle={{ color: COLORS.primary, fontSize: 12 }}>
                    {s}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          {!user?.companyName && !user?.bio && !user?.portfolioUrl && !user?.locationAddress && user?.skills?.length === 0 && (
            <View style={{ padding: 20 }}>
              <Text style={{ color: COLORS.gray500, textAlign: 'center' }}>
                Aún no has completado tu perfil. Pulsa "Editar" para agregar más detalles.
              </Text>
            </View>
          )}
        </Card>
      </List.Section>

      <List.Section>
        <List.Subheader>Secciones</List.Subheader>
        <Card mode="outlined" style={{ borderRadius: 12 }}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.getParent()?.navigate('Notifications' as any)}
          >
            <View style={[styles.listIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: COLORS.gray800 }}>Notificaciones</Text>
              <Text style={{ fontSize: 12, color: COLORS.gray500 }}>
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones nuevas'}
              </Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.navigate('MisCosas' as never)}
          >
            <View style={[styles.listIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="folder-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: COLORS.gray800 }}>Mis Cosas</Text>
              <Text style={{ fontSize: 12, color: COLORS.gray500 }}>Publicaciones y postulaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
          </TouchableOpacity>
        </Card>
      </List.Section>

      <Modal visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <EditProfileModal
          user={user}
          loading={updateMut.isPending}
          onSubmit={(d) => updateMut.mutate(d)}
          onClose={() => setEditOpen(false)}
        />
      </Modal>

      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </ScrollView>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View>
    <View style={styles.listItem}>
      <View style={[styles.listIcon, { backgroundColor: COLORS.gray100, width: 34, height: 34 }]}>
        <Ionicons name={icon as any} size={16} color={COLORS.gray600} />
      </View>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ fontSize: 11, color: COLORS.gray500 }}>{label}</Text>
        <Text style={{ color: COLORS.gray800 }}>{value}</Text>
      </View>
    </View>
    <Divider />
  </View>
);

interface EditProps {
  user: any;
  loading: boolean;
  onSubmit: (d: UpdateProfileForm) => void;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProps> = ({ user, loading, onSubmit, onClose }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      companyName: user?.companyName || '',
      portfolioUrl: user?.portfolioUrl || '',
      bio: user?.bio || '',
      experienceYears: user?.experienceYears ?? null,
      skills: user?.skills || [],
      locationAddress: user?.locationAddress || '',
    },
  });

  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));

  const submit = (d: UpdateProfileForm) => {
    const skillsArr = skillsText
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    onSubmit({ ...d, skills: skillsArr });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Editar perfil</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color={COLORS.gray700} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Field control={control as any} name="fullName" label="Nombre completo" placeholder="Tu nombre" errors={errors} />
        <Field control={control as any} name="phone" label="Teléfono" placeholder="(+34) ..." errors={errors} />
        <Field control={control as any} name="companyName" label="Empresa (opcional)" placeholder="Nombre de tu empresa" errors={errors} />
        <Field control={control as any} name="portfolioUrl" label="Portafolio (opcional)" placeholder="https://..." errors={errors} />
        <Field control={control as any} name="locationAddress" label="Ubicación" placeholder="Dirección, ciudad..." errors={errors} />

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.lbl}>Años de experiencia (opcional)</Text>
          <Controller control={control} name="experienceYears" render={({ field }) => (
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={field.value != null ? String(field.value) : ''}
              onChangeText={(v) => field.onChange(v === '' ? null : Number(v))}
            />
          )} />
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.lbl}>Habilidades (separadas por coma)</Text>
          <TextInput
            mode="outlined"
            placeholder="Ej: React, Carpintería, Diseño gráfico"
            value={skillsText}
            onChangeText={setSkillsText}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.lbl}>Biografía</Text>
          <Controller control={control} name="bio" render={({ field }) => (
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Cuéntanos sobre ti..."
              value={(field.value as string) || ''}
              onChangeText={field.onChange}
              style={{ textAlignVertical: 'top' }}
            />
          )} />
        </View>

        <Button mode="contained" onPress={handleSubmit(submit)} loading={loading} disabled={loading} contentStyle={{ height: 48 }} style={{ borderRadius: 10 }}>
          Guardar cambios
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Field: React.FC<any> = ({ control, name, label, placeholder, errors }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={styles.lbl}>{label}</Text>
    <Controller control={control} name={name} render={({ field }) => (
      <>
        <TextInput
          mode="outlined"
          placeholder={placeholder}
          value={(field.value as string) || ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={!!errors?.[name]}
        />
        {errors?.[name]?.message && <HelperText type="error">{errors[name].message}</HelperText>}
      </>
    )} />
  </View>
);

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 14,
    borderRadius: 16,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingTop: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
  lbl: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
});

export default ProfileScreen;
