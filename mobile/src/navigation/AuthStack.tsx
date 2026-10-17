import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyScreen from '../screens/auth/VerifyScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verify: { token?: string; email?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="Verify"
        component={VerifyScreen}
        options={{ headerShown: true, title: 'Verificar Email' }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
