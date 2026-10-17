import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TouchableOpacity, Platform } from 'react-native';
import { Text, TextInput, Button, Chip, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, CATEGORIES_DEFAULT } from '../constants';
import { jobsApi, categoriesApi } from '../lib/axios';
import { ScreenContainer, JobCard, EmptyState } from '../components/Shared';
import type { Job, Category } from '../types';

interface Filters {
  search: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [filters, setFilters] = useState<Filters>({
    search: '', category: '', budgetMin: '', budgetMax: '', deadline: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const params = useMemo(() => {
    const p: any = { limit: 50 };
    if (filters.search) p.search = filters.search;
    if (filters.category) p.category = filters.category;
    if (filters.budgetMin) p.budgetMin = filters.budgetMin;
    if (filters.budgetMax) p.budgetMax = filters.budgetMax;
    if (filters.deadline) p.deadlineFrom = filters.deadline;
    return p;
  }, [filters]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['jobs', 'search', params],
    queryFn: async () => {
      const r = await jobsApi.list(params);
      return (r.data?.data as Job[]) || [];
    },
  });

  const hasActiveFilters =
    filters.category || filters.budgetMin || filters.budgetMax || filters.deadline;

  const resetFilters = () => setFilters({ search: '', category: '', budgetMin: '', budgetMax: '', deadline: '' });

  const activeChips: { label: string; val: string; key: keyof Filters }[] = [];
  if (filters.category) {
    const c = categories.find((x) => x.id === filters.category);
    if (c) activeChips.push({ label: c.name, val: filters.category, key: 'category' });
  }
  if (filters.budgetMin || filters.budgetMax)
    activeChips.push({ label: `$${filters.budgetMin || 0} - $${filters.budgetMax || '∞'}`, val: '', key: 'budgetMin' });
  if (filters.deadline) activeChips.push({ label: `Hasta ${filters.deadline.slice(0, 10)}`, val: '', key: 'deadline' });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.searchWrap}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.gray200 }}>
          <Ionicons name="search-outline" size={20} color={COLORS.gray500} />
          <TextInput
            placeholder="Buscar trabajos..."
            value={filters.search}
            onChangeText={(t) => setFilters((f) => ({ ...f, search: t }))}
            onSubmitEditing={() => refetch()}
            style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, height: 44 }}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          {filters.search ? (
            <TouchableOpacity onPress={() => { setFilters((f) => ({ ...f, search: '' })); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.filterBtn, hasActiveFilters ? { backgroundColor: COLORS.primary } : null]} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={20} color={hasActiveFilters ? COLORS.white : COLORS.gray700} />
        </TouchableOpacity>
      </View>

      {activeChips.length > 0 && (
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 8 }}>
          {activeChips.map((c, i) => (
            <Chip
              key={i}
              onClose={() => {
                if (c.key === 'budgetMin') setFilters((f) => ({ ...f, budgetMin: '', budgetMax: '' }));
                else setFilters((f) => ({ ...f, [c.key]: '' } as any));
              }}
              mode="flat"
              style={{ backgroundColor: COLORS.primary + '18' }}
              textStyle={{ color: COLORS.primary }}
            >
              {c.label}
            </Chip>
          ))}
          <Button mode="text" compact onPress={resetFilters} style={{ marginTop: -4 }}>Limpiar</Button>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        refreshing={isLoading || isFetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            message={hasActiveFilters ? 'Sin resultados con estos filtros' : 'No hay trabajos aún'}
            icon="magnify"
          />
        }
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.getParent()?.navigate('JobDetail', { jobId: item.id })}
          />
        )}
        ListFooterComponent={
          data && data.length >= 50 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Button mode="outlined" onPress={() => refetch()}>Cargar más</Button>
            </View>
          ) : null
        }
      />

      <Modal visible={showFilters} animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros de búsqueda</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={26} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Divider style={{ marginBottom: 16 }} />

            <Text style={styles.lbl}>Categoría</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={filters.category}
                onValueChange={(v) => setFilters((f) => ({ ...f, category: v as string }))}
                style={{ height: 44 }}
              >
                <Picker.Item label="Todas las categorías" value="" />
                {categories.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lbl}>Presupuesto Mín ($)</Text>
                <TextInput
                  keyboardType="numeric"
                  mode="outlined"
                  value={filters.budgetMin}
                  onChangeText={(v) => setFilters((f) => ({ ...f, budgetMin: v }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lbl}>Presupuesto Máx ($)</Text>
                <TextInput
                  keyboardType="numeric"
                  mode="outlined"
                  value={filters.budgetMax}
                  onChangeText={(v) => setFilters((f) => ({ ...f, budgetMax: v }))}
                />
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.lbl}>Fecha límite desde</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray500} />
                <Text style={{ flex: 1, marginLeft: 10, color: filters.deadline ? COLORS.gray800 : COLORS.gray400 }}>
                  {filters.deadline ? new Date(filters.deadline).toLocaleDateString() : 'Selecciona fecha'}
                </Text>
                {filters.deadline ? (
                  <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, deadline: '' }))}>
                    <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={filters.deadline ? new Date(filters.deadline) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setFilters((f) => ({ ...f, deadline: date.toISOString() }));
                  }}
                />
              )}
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ padding: 16, flexDirection: 'row', gap: 10 }}>
            <Button mode="outlined" style={{ flex: 1 }} onPress={resetFilters}>Limpiar</Button>
            <Button mode="contained" style={{ flex: 1 }} onPress={() => { setShowFilters(false); refetch(); }}>Aplicar</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: COLORS.white,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray800 },
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

export default SearchScreen;
