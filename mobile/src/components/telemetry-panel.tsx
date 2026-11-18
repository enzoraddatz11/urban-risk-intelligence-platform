import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Polygon, Polyline, Stop } from 'react-native-svg';
import { api } from '@/services/api';
import type { EntityMap } from '@/types/api';
import { chartGeometry, prepareReadings } from '@/features/readings-chart';
import { SelectField } from '@/components/select-field';
import { Button, EmptyState, ErrorNotice, Loading, SectionHeading, common } from '@/components/ui';
import { colors } from '@/theme';

export function TelemetryPanel({ revision, onOpen }: { revision: string; onOpen: () => void }) {
  const [sensors, setSensors] = useState<EntityMap['sensors'][]>([]);
  const [sensorId, setSensorId] = useState('');
  const [readings, setReadings] = useState<EntityMap['readings'][]>([]);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sensorError, setSensorError] = useState('');
  const request = useRef(0);
  const loadSensors = useCallback(async () => {
    setLoadingSensors(true); setSensorError('');
    try {
      const rows = await api.all('sensors');
      setSensors(rows); setSensorId(previous => rows.some(sensor => String(sensor.id) === previous) ? previous : rows[0] ? String(rows[0].id) : '');
    } catch (error) { setSensorError(error instanceof Error ? error.message : 'Falha ao consultar sensores.'); }
    finally { setLoadingSensors(false); }
  }, []);
  useEffect(() => { void loadSensors(); }, [loadSensors, revision]);
  const load = useCallback(async () => {
    if (!sensorId) return;
    const token = ++request.current; setLoading(true); setError(''); setReadings([]);
    try {
      const page = await api.readingsForSensor(Number(sensorId));
      if (token === request.current) setReadings(prepareReadings(page.content, Number(sensorId)));
    } catch (error) { if (token === request.current) setError(error instanceof Error ? error.message : 'Falha ao consultar medições.'); }
    finally { if (token === request.current) setLoading(false); }
  }, [sensorId]);
  useEffect(() => { void load(); return () => { request.current++; }; }, [load, revision]);
  const sensor = sensors.find(sensor => String(sensor.id) === sensorId);
  const chart = chartGeometry(readings);
  const format = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
  return <View style={common.card}>
    <SectionHeading title="Leituras dos sensores" caption="Últimas medições de um sensor · uma unidade por série" icon="pulse-outline" />
    {sensorError ? <ErrorNotice message={sensorError} onRetry={loadSensors} /> : loadingSensors ? <Loading label="Carregando sensores…" />
      : !sensors.length ? <EmptyState title="Sem sensores cadastrados" description="Adicione um sensor e suas medições para acompanhar a evolução." />
      : <>
        <SelectField label="Sensor em análise" required={false} options={sensors.map(sensor => ({ label: sensor.name + ' · ' + sensor.unit, value: String(sensor.id) }))}
          value={sensorId} onChange={value => { if (value !== sensorId) { request.current++; setReadings([]); setError(''); setLoading(true); setSensorId(value); } }} />
        {error && <ErrorNotice message={error} onRetry={load} />}
        {loading ? <Loading label="Consultando medições…" /> : chart ? <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <Text selectable style={{ color: colors.text, fontSize: 34, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{format(chart.latest.value)}</Text>
            <Text selectable style={{ color: colors.accent, fontSize: 16 }}>{sensor?.unit}</Text>
            <Text style={{ ...common.subtitle, fontSize: 11 }}>última medição da amostra</Text>
          </View>
          <View accessible accessibilityLabel={'Gráfico de ' + readings.length + ' medições de ' + sensor?.name} style={{ height: 154 }}>
            <Svg width="100%" height="100%" viewBox="0 0 320 144">
              <Defs><LinearGradient id="telemetry-fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.accent} stopOpacity=".16" /><Stop offset="1" stopColor={colors.accent} stopOpacity="0" /></LinearGradient></Defs>
              {[20, 72, 124].map(y => <Line key={y} x1={0} x2={320} y1={y} y2={y} stroke={colors.border} strokeDasharray="3 5" />)}
              {readings.length > 1 && <><Polygon points={chart.points[0].x + ',144 ' + chart.line + ' ' + chart.points[chart.points.length - 1].x + ',144'} fill="url(#telemetry-fill)" />
                <Polyline points={chart.line} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" /></>}
              {chart.points.map((point, index) => <Circle key={readings[index].id} cx={point.x} cy={point.y} r={3} fill={colors.accent} stroke={colors.surface} strokeWidth={1.5} />)}
            </Svg>
          </View>
          <View style={{ ...common.row, justifyContent: 'space-between' }}>
            <Text selectable style={{ ...common.subtitle, fontSize: 11 }}>{new Date(readings[0].recordedAt).toLocaleString('pt-BR')}</Text>
            {readings.length > 1 && <Text selectable style={{ ...common.subtitle, fontSize: 11 }}>{new Date(chart.latest.recordedAt).toLocaleString('pt-BR')}</Text>}
          </View>
          <View style={{ ...common.row, justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, paddingTop: 14 }}>
            <Text selectable style={common.subtitle}>Mín. {format(chart.min)} {sensor?.unit}</Text>
            <Text selectable style={common.subtitle}>Máx. {format(chart.max)} {sensor?.unit}</Text>
          </View>
          <Text style={{ ...common.subtitle, fontSize: 11 }}>{readings.length === 1 ? 'Uma medição disponível. Registre outra para comparar a evolução.' : readings.length + ' medições da amostra · horário local'}</Text>
        </> : !error ? <EmptyState title="Sem medições para este sensor" description="Registre a primeira leitura para iniciar o acompanhamento." /> : null}
      </>}
    <Button title="Ver leituras" secondary icon="arrow-forward" onPress={onOpen} />
  </View>;
}
