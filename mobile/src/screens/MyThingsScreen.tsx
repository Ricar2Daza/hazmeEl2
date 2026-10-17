import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants';
import MyPublicacionesScreen from './MyPublicacionesScreen';
import MyPostulacionesScreen from './MyPostulacionesScreen';

const MyThingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'pub' | 'post'>('pub');
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.segmentWrap}>
        <Button
          mode="outlined"
          icon="message-text-outline"
          onPress={() => navigation.getParent()?.navigate('ChatInbox')}
          style={{ marginBottom: 10, borderColor: COLORS.gray300 }}
        >
          Ver conversaciones
        </Button>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as any)}
          buttons={[
            { value: 'pub', label: 'Mis Publicaciones', icon: 'briefcase-outline' },
            { value: 'post', label: 'Mis Postulaciones', icon: 'send-outline' },
          ]}
          style={styles.segment}
        />
      </View>
      {tab === 'pub' ? <MyPublicacionesScreen /> : <MyPostulacionesScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentWrap: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  segment: {
    borderRadius: 10,
  },
});

export default MyThingsScreen;
