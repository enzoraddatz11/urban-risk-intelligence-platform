import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { NativeEnumPicker } from '@/components/native-enum-picker';
import { colors } from '@/theme';
import type { Option } from '@/features/resources';

export function SelectField({ label, options, value, onChange, disabled = false, error, nativePicker = false }: {
  label: string; options: Option[]; value: string; onChange: (value: string) => void; disabled?: boolean; error?: string; nativePicker?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.value === value);
  const filtered = useMemo(() => options.filter(option => option.label.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))), [options, search]);
  if (nativePicker && process.env.EXPO_OS !== 'web') return <NativeEnumPicker label={label} options={options} value={value} onChange={onChange} disabled={disabled} error={error} />;
  return <View style={{ gap: 8 }}>
    <Text style={styles.label}>{label} <Text style={{ color: colors.cyan }}>*</Text></Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label + ': ' + (selected?.label ?? 'Selecione')}
      accessibilityState={{ disabled }} disabled={disabled}
      onPress={() => { setSearch(''); setVisible(true); }}
      style={[styles.input, !!error && { borderColor: colors.red }, disabled && { opacity: 0.5 }]}>
      <Text style={{ color: selected ? colors.text : colors.muted, flex: 1 }}>{selected?.label ?? 'Selecione um registro'}</Text>
      <AppIcon name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
    {error && <Text selectable style={styles.error}>{error}</Text>}
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.heading}>{label}</Text>
            <Pressable accessibilityLabel="Fechar seleção" accessibilityRole="button" onPress={() => setVisible(false)} style={{ padding: 12 }}><AppIcon name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <TextInput accessibilityLabel="Buscar opções" placeholder="Buscar por nome ou ID…" placeholderTextColor={colors.muted}
            value={search} onChangeText={setSearch} style={[styles.input, { color: colors.text }]} />
          <FlatList contentInsetAdjustmentBehavior="automatic" data={filtered} keyExtractor={option => option.value} keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: colors.muted, padding: 20 }}>Nenhuma opção encontrada.</Text>}
            renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.value === value }}
              onPress={() => { onChange(item.value); setVisible(false); }} style={styles.option}>
              <Text style={{ color: item.value === value ? colors.cyan : colors.text, flex: 1, lineHeight: 21 }}>{item.label}</Text>
              {item.value === value && <AppIcon name="checkmark-circle" size={20} color={colors.cyan} />}
            </Pressable>} />
        </View>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { color: colors.red, fontSize: 12, lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, borderCurve: 'continuous', width: '100%', maxWidth: 600, maxHeight: '80%', padding: 18, gap: 12 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  option: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
});

