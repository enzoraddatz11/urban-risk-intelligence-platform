import { Host, Picker } from '@expo/ui';
import { Text, View } from 'react-native';
import type { Option } from '@/features/resources';
import { colors, radii } from '@/theme';

// Seleções curtas usam controles SwiftUI/Compose. Relações extensas mantêm busca virtualizada.
export function NativeEnumPicker({ label, options, value, onChange, disabled, error }: {
  label: string; options: Option[]; value: string; onChange: (value: string) => void; disabled?: boolean; error?: string;
}) {
  return <View style={{ gap: 8 }}>
    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{label} <Text style={{ color: colors.accent }}>*</Text></Text>
    <View style={{ borderRadius: radii.sm, borderWidth: 1, borderColor: error ? colors.red : colors.border, padding: 8, minHeight: 52, backgroundColor: colors.raised }}>
      <Host matchContents colorScheme="dark" seedColor={colors.accent} style={{ width: '100%' }}>
        <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled} testID={label}>
          {options.map(option => <Picker.Item key={option.value} value={option.value} label={option.label} />)}
        </Picker>
      </Host>
    </View>
    {error && <Text selectable style={{ color: colors.red, fontSize: 12 }}>{error}</Text>}
  </View>;
}
