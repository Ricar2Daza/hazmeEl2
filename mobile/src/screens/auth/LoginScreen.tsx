import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, LoginForm } from '../../lib/zodSchemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { AppSnackbar, SnackState } from '../../components/Shared';
import Ionicons from '@expo/vector-icons/Ionicons';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const login = useAuthStore((s) => s.login);
  const [secure, setSecure] = useState(true);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      setSnack({ visible: true, message: 'Bienvenido', type: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciales inválidas';
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
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="briefcase-outline" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.title}>HazMe</Text>
        <Text style={styles.subtitle}>Conecta talento con oportunidades</Text>
      </View>

      <View style={styles.card}>
        <Text variant="headlineSmall" style={styles.cardTitle}>
          Iniciar Sesión
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 4 }}>
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
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 16 }}>
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
          Entrar
        </Button>

        <View style={styles.row}>
          <Text style={{ color: COLORS.gray600 }}>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    color: COLORS.white + 'cc',
    marginTop: 4,
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
    marginBottom: 18,
    color: COLORS.gray800,
  },
  btn: { borderRadius: 10, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  link: { color: COLORS.primary, fontWeight: '600' },
});

export default LoginScreen;
