import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { registerSchema, RegisterForm } from '../../lib/zodSchemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { AppSnackbar, SnackState } from '../../components/Shared';
import Ionicons from '@expo/vector-icons/Ionicons';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const doRegister = useAuthStore((s) => s.register);
  const [secure, setSecure] = useState(true);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', phone: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      };
      if (data.phone) payload.phone = data.phone;
      await doRegister(payload);
      setSnack({ visible: true, message: 'Registro exitoso. Verifica tu email.', type: 'success' });
      setTimeout(() => {
        navigation.navigate('Verify', { email: data.email });
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error en el registro';
      setSnack({ visible: true, message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="briefcase-outline" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>HazMe</Text>
          <Text style={styles.subtitle}>Crea tu cuenta y empieza</Text>
        </View>

        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            Crear cuenta
          </Text>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <TextInput
                  label="Nombre completo"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  autoCapitalize="words"
                  left={<TextInput.Icon icon="account-outline" />}
                  error={!!errors.fullName}
                />
                {errors.fullName && <HelperText type="error">{errors.fullName.message}</HelperText>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <TextInput
                  label="Email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  left={<TextInput.Icon icon="email-outline" />}
                  error={!!errors.email}
                />
                {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <TextInput
                  label="Teléfono (opcional)"
                  value={value || ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone-outline" />}
                  error={!!errors.phone}
                />
                {errors.phone && <HelperText type="error">{(errors.phone as any).message}</HelperText>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <TextInput
                  label="Contraseña"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  secureTextEntry={secure}
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={secure ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setSecure(!secure)}
                    />
                  }
                  error={!!errors.password}
                />
                {errors.password && <HelperText type="error">{errors.password.message}</HelperText>}
                <Text style={{ fontSize: 11, color: COLORS.gray500, marginTop: 4 }}>
                  Al menos 8 caracteres
                </Text>
              </View>
            )}
          />

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={handleSubmit(onSubmit)}
            style={styles.btn}
            contentStyle={{ height: 48 }}
          >
            Registrarme
          </Button>

          <View style={styles.row}>
            <Text style={{ color: COLORS.gray600 }}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}> Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    color: COLORS.white + 'cc',
    marginTop: 2,
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 14,
    color: COLORS.gray800,
  },
  field: { marginBottom: 2 },
  btn: { borderRadius: 10, marginTop: 6, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  link: { color: COLORS.primary, fontWeight: '600' },
});

export default RegisterScreen;
