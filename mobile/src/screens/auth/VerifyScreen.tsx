import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { verifyEmailSchema } from '../../lib/zodSchemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { AppSnackbar, SnackState } from '../../components/Shared';
import Ionicons from '@expo/vector-icons/Ionicons';

type NavProp = any;
type ScreenRouteProp = RouteProp<AuthStackParamList, 'Verify'>;

interface Form { token: string }

const VerifyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const doVerify = useAuthStore((s) => s.verifyEmail);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '', type: 'info' });

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(verifyEmailSchema) as any,
    defaultValues: { token: route.params?.token || '' },
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await doVerify(data.token);
      setVerified(true);
      setSnack({ visible: true, message: 'Email verificado! Ya puedes iniciar sesión.', type: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Token inválido';
      setSnack({ visible: true, message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={verified ? styles.iconOk : styles.iconBox}>
        <Ionicons
          name={verified ? 'checkmark-circle' : 'mail-open-outline'}
          size={72}
          color={verified ? COLORS.success : COLORS.primary}
        />
      </View>
      <Text variant="headlineMedium" style={styles.title}>
        {verified ? '¡Verificado!' : 'Verifica tu Email'}
      </Text>
      <Text style={styles.subtitle}>
        {verified
          ? 'Tu cuenta ha sido activada. Ahora puedes iniciar sesión.'
          : 'Hemos enviado un enlace de verificación a tu correo. Introduce el token o presiona el enlace del email.'}
      </Text>
      {route.params?.email && (
        <Text style={styles.email}>Enviado a: {route.params.email}</Text>
      )}
      {!verified && (
        <>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ marginTop: 18, marginBottom: 4, width: '100%' }}>
                <TextInput
                  label="Token de verificación"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  autoCapitalize="characters"
                  error={!!errors.token}
                />
                {errors.token && <HelperText type="error">{(errors.token as any).message}</HelperText>}
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
            Verificar
          </Button>
        </>
      )}
      <Button
        mode="text"
        style={{ marginTop: 14 }}
        onPress={() => navigation.navigate('Login')}
      >
        {verified ? 'Ir a Iniciar Sesión' : 'Volver al inicio'}
      </Button>
      <AppSnackbar snack={snack} onDismiss={() => setSnack((s) => ({ ...s, visible: false }))} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingTop: 60,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconOk: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontWeight: '700', color: COLORS.gray800, textAlign: 'center' },
  subtitle: {
    marginTop: 10,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  email: { marginTop: 8, color: COLORS.primary, fontWeight: '600' },
  btn: { marginTop: 10, borderRadius: 10, width: '100%' },
});

export default VerifyScreen;
