import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PublishJobScreen from '../screens/PublishJobScreen';
import MyThingsScreen from '../screens/MyThingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifStore } from '../store/notifStore';
import { COLORS } from '../constants';

export type MainTabsParamList = {
  Inicio: undefined;
  Buscar: undefined;
  Publicar: undefined;
  MisCosas: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const BadgeIcon: React.FC<{ name: string; badge?: number; color: string; size: number }> = ({
  name,
  badge,
  color,
  size,
}) => (
  <View style={{ position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name as any} color={color} size={size} />
    {badge && badge > 0 ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    ) : null}
  </View>
);

const MainTabs: React.FC = () => {
  const unreadCount = useNotifStore((s) => s.unreadCount);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          let badge: number | undefined;
          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Buscar':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Publicar':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'MisCosas':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              badge = unreadCount;
              break;
          }
          return <BadgeIcon name={iconName} color={color} size={size} badge={badge} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: true,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Buscar" component={SearchScreen} options={{ title: 'Buscar Trabajos' }} />
      <Tab.Screen name="Publicar" component={PublishJobScreen} options={{ title: 'Publicar' }} />
      <Tab.Screen name="MisCosas" component={MyThingsScreen} options={{ title: 'Mis Cosas' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
});

export default MainTabs;
