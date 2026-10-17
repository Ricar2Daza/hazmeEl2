import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { COLORS } from '../constants';
import MyPublicacionesScreen from './MyPublicacionesScreen';
import MyPostulacionesScreen from './MyPostulacionesScreen';

const MyThingsScreen: React.FC = () => {
  const [tab, setTab] = useState<'pub' | 'post'>('pub');
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.segmentWrap}>
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
