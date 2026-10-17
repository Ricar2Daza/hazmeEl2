import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import JobDetailScreen from '../screens/JobDetailScreen';
import GestionarPostulantesScreen from '../screens/GestionarPostulantesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { initSocket, setupSocketListeners, disconnectSocket } from '../lib/socket';
import { useNotifStore } from '../store/notifStore';
import { notificationsApi } from '../lib/axios';
import { COLORS } from '../constants';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  JobDetail: { jobId: string };
  ManageApplicants: { jobId: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, hydrate } = useAuthStore();
  const incrementUnread = useNotifStore((s) => s.incrementUnread);
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    hydrate().finally(() => setHydrating(false));
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated && !hydrating) {
      initSocket().then(() => {
        setupSocketListeners(
          () => incrementUnread(1),
          () => incrementUnread(1),
          () => incrementUnread(1)
        );
      });
      notificationsApi.unreadCount()
        .then((r) => setUnreadCount(r.data.count || 0))
        .catch(() => {});
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, hydrating]);

  if (hydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="JobDetail"
              component={JobDetailScreen}
              options={{ headerShown: true, title: 'Detalle del Trabajo' }}
            />
            <Stack.Screen
              name="ManageApplicants"
              component={GestionarPostulantesScreen}
              options={{ headerShown: true, title: 'Postulantes' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: true, title: 'Notificaciones' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
