import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Resource } from '@/types/api';
import { AppIcon } from '@/components/app-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorNotice, Loading, common } from '@/components/ui';
import { SelectField } from '@/components/select-field';
import { resources, type Option } from '@/features/resources';
import { buildPayload, FormValidationError, initialValues } from '@/features/validation';
import { api } from '@/services/api';
import { ApiError } from '@/services/client';
import { colors } from '@/theme';
const SUCCESS_ENTER = FadeIn.duration(220).reduceMotion(ReduceMotion.System);

export function CreateScreen({ resource }: { resource: Resource }) {
  const insets = useSafeAreaInsets();
  const definition = resources[resource];
  const [values, setValues] = useState(() => initialValues(resource));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const savingRef = useRef(false);
  const version = useRef(0);
  const relation = definition.fields.find(field => field.kind === 'relation');

  const loadOptions = useCallback(async () => {
    if (!relation?.relation) return;
    const current = ++version.current;
    setLoadingOptions(true); setOptionsError('');
    try {
      const records = await api.all(relation.relation);
      if (current === version.current) setOptions(records.map(record => ({
        label: ('name' in record ? record.name : 'Registro') + ' · #' + record.id,
        value: String(record.id),
      })));
    } catch (error) { if (current === version.current) setOptionsError(error instanceof Error ? error.message : 'Não foi possível carregar opções.'); }
    finally { if (current === version.current) setLoadingOptions(false); }
  }, [relation]);
  useEffect(() => { void loadOptions(); return () => { version.current++; }; }, [loadOptions]);

  const change = (key: string, value: string) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
  };
  const submit = async () => {
    if (savingRef.current) return;
    setError(''); setErrors({});
    try {
      const payload = buildPayload(resource, values);
      if (relation && !options.some(option => option.value === values[relation.key])) {
        setErrors({ [relation.key]: 'Selecione um registro disponível.' }); return;
      }
      savingRef.current = true; setSaving(true);
      const created = await api.create(resource, payload);
      setSavedLabel('name' in created ? created.name : 'title' in created ? created.title
        : 'Leitura de ' + (options.find(option => option.value === String(created.sensorId))?.label ?? 'sensor #' + created.sensorId));
      setSavedId(created.id);
      if (process.env.EXPO_OS === 'ios') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      if (error instanceof FormValidationError) setErrors(error.fields);
      else if (error instanceof ApiError) { setErrors(error.fields); setError(error.message); }
      else setError('Não foi possível concluir o cadastro.');
    } finally { savingRef.current = false; setSaving(false); }
  };
  if (savedId !== null) return <View style={styles.page}>
    <Stack.Screen options={{ title: 'Registro salvo' }} /><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[common.content, { paddingTop: 40, paddingBottom: insets.bottom + 40 }]}>
      <Animated.View entering={SUCCESS_ENTER} style={[common.card, { alignItems: 'center', paddingVertical: 36 }]}>
        <AppIcon name="checkmark-circle-outline" size={58} color={colors.green} />
        <Text style={[common.title, { textAlign: 'center' }]}>Cadastro confirmado</Text>
        <Text selectable style={[common.subtitle, { textAlign: 'center', color: colors.text }]}>{savedLabel}</Text>
        <Text selectable style={[common.subtitle, { textAlign: 'center', fontSize: 11 }]}>Identificador #{savedId} · salvo pela API.</Text>
        <Text selectable style={[common.subtitle, { textAlign: 'center' }]}>A listagem será atualizada ao voltar.</Text>
        <Button title="Voltar à lista" icon="arrow-back" onPress={() => router.back()} />
      </Animated.View>
    </ScrollView>
  </View>;

  return <View style={styles.page}>
    <Stack.Screen options={{ title: resource === 'readings' ? 'Nova leitura' : 'Novo ' + definition.singular }} />
      <KeyboardAwareScrollView bottomOffset={24} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[common.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={{ gap: 8 }}><Text style={common.eyebrow}>NOVO REGISTRO</Text><Text style={common.title}>Dados do registro</Text><Text style={common.subtitle}>Preencha os campos para enviar à missão. Todos os campos são obrigatórios.</Text></View>
        {resource === 'alerts' && <View style={common.card}><Text style={common.subtitle}>Este cadastro registra um alerta crítico. Escolha se ele está ativo ou já foi resolvido.</Text></View>}
        {!!optionsError && <ErrorNotice message={optionsError} onRetry={loadOptions} />}
        {loadingOptions && <Loading label="Consultando registros disponíveis…" />}
        {relation && !loadingOptions && !optionsError && options.length === 0 && <View style={common.card}>
          <Text style={common.subtitle}>Ainda não há {resources[relation.relation!].title.toLocaleLowerCase('pt-BR')} disponíveis. Cadastre um registro na tela correspondente e atualize as opções.</Text>
          <Button title="Atualizar opções" secondary onPress={loadOptions} icon="refresh-outline" />
        </View>}
        <View style={common.card}>
          {definition.fields.map(field => {
            if (field.kind === 'select' || field.kind === 'relation') return <SelectField key={field.key} label={field.label}
              value={values[field.key]} options={field.options ?? options} onChange={value => change(field.key, value)}
              nativePicker={field.kind === 'select'} error={errors[field.key]} disabled={saving || (field.kind === 'relation' && (loadingOptions || !!optionsError || options.length === 0))} />;
            return <View key={field.key} style={{ gap: 8 }}>
              <Text style={styles.label}>{field.label} <Text style={{ color: colors.cyan }}>*</Text></Text>
              <TextInput accessibilityLabel={field.label} editable={!saving}
                value={values[field.key]} onChangeText={value => change(field.key, value)}
                placeholder={field.placeholder} placeholderTextColor={colors.muted} maxLength={field.max}
                multiline={field.multiline} autoCapitalize={field.kind === 'date' ? 'none' : 'sentences'}
                autoCorrect={field.kind === 'text'} keyboardType={field.kind === 'decimal' && process.env.EXPO_OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                style={[styles.input, field.multiline && { minHeight: 100, textAlignVertical: 'top' }, !!errors[field.key] && { borderColor: colors.red }]} />
              {field.kind === 'date' && <View style={{ gap: 8 }}>
                <Text selectable style={styles.help}>ISO 8601 com fuso. A data não pode estar no futuro.</Text>
                <Button title="Usar horário atual" secondary icon="time-outline" disabled={saving} onPress={() => change(field.key, new Date().toISOString())} />
              </View>}
              {field.kind === 'decimal' && <Text selectable style={styles.help}>Aceita negativos e vírgula ou ponto decimal. Não use separador de milhar.</Text>}
              {!!errors[field.key] && <Text selectable accessibilityRole="alert" style={styles.fieldError}>{errors[field.key]}</Text>}
            </View>;
          })}
        </View>
        {!!Object.keys(errors).length && <Text selectable accessibilityRole="alert" style={styles.fieldError}>Revise os campos destacados antes de enviar.</Text>}
        {!!error && <ErrorNotice message={error} />}
        <Button title="Salvar registro" icon="cloud-upload-outline" busy={saving}
          disabled={!!relation && (loadingOptions || !!optionsError || options.length === 0)} onPress={submit} />
        <Button title="Cancelar" secondary disabled={saving} onPress={() => router.back()} />
      </KeyboardAwareScrollView>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 12, borderCurve: 'continuous', padding: 14, color: colors.text, minHeight: 50, fontSize: 15, lineHeight: 23 },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  fieldError: { color: colors.red, fontSize: 13, lineHeight: 20 },
});

