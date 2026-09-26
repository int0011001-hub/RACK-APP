import { useState, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme';

type Dia = { id: string; nombre: string; orden: number };

const TAMANOS = [
  { id: 'compacto', label: 'Compacto' },
  { id: 'normal', label: 'Normal' },
  { id: 'grande', label: 'Grande' },
] as const;

export default function EditorRutina() {
  const { accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mostrarRir, setMostrarRir] = useState(true);
  const [tamanoHoja, setTamanoHoja] = useState<'compacto' | 'normal' | 'grande'>('normal');
  const [dias, setDias] = useState<Dia[]>([]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  async function cargar() {
    const { data: rutina } = await supabase.from('rutina').select('mostrar_rir, tamano_hoja').eq('id', id).single();
    setMostrarRir(rutina?.mostrar_rir ?? true);
    setTamanoHoja((rutina?.tamano_hoja as any) ?? 'normal');

    const { data: diasData } = await supabase.from('dia').select('id, nombre, orden').eq('rutina_id', id).order('orden');
    setDias(diasData ?? []);
  }

  async function toggleRir(valor: boolean) {
    setMostrarRir(valor);
    await supabase.from('rutina').update({ mostrar_rir: valor }).eq('id', id);
  }

  async function elegirTamano(t: 'compacto' | 'normal' | 'grande') {
    setTamanoHoja(t);
    await supabase.from('rutina').update({ tamano_hoja: t }).eq('id', id);
  }

  async function onDragEnd({ data }: { data: Dia[] }) {
    setDias(data);
    await Promise.all(data.map((d, i) => supabase.from('dia').update({ orden: i + 1 }).eq('id', d.id)));
  }

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={dias}
        keyExtractor={(item) => item.id}
        onDragEnd={onDragEnd}
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
        ListHeaderComponent={() => (
          <View>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Modo editor</Text>
            <Text style={styles.sub}>Estos ajustes solo afectan a esta rutina.</Text>

            <View style={styles.section}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Mostrar RIR</Text>
                  <Text style={styles.rowDesc}>Añade un campo para anotar cuántas repeticiones te quedaban en el tanque.</Text>
                </View>
                <Switch value={mostrarRir} onValueChange={toggleRir} trackColor={{ false: '#17181B', true: accent }} thumbColor="#ECE8DE" />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.rowTitle}>Tamaño de las hojas</Text>
              <Text style={styles.rowDesc}>Afecta al tamaño de texto y casillas al registrar series.</Text>
              <View style={styles.tamanoRow}>
                {TAMANOS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tamanoChip, tamanoHoja === t.id && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => elegirTamano(t.id)}
                  >
                    <Text style={[styles.tamanoText, tamanoHoja === t.id && styles.tamanoTextActiva]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.rowTitle}>Orden de los días</Text>
            <Text style={styles.rowDesc}>Mantén pulsado y arrastra para reordenar.</Text>
          </View>
        )}
        renderItem={({ item, drag, isActive }: RenderItemParams<Dia>) => (
          <ScaleDecorator>
            <TouchableOpacity
              style={[styles.diaRow, isActive && { borderColor: accent }]}
              onLongPress={drag}
              disabled={isActive}
            >
              <Text style={styles.diaHandle}>☰</Text>
              <Text style={styles.diaNombre}>{item.nombre}</Text>
            </TouchableOpacity>
          </ScaleDecorator>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 20 },
  title: { color: '#ECE8DE', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  sub: { color: '#8B8D97', fontSize: 12, marginBottom: 20 },
  section: { backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: '#ECE8DE', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  rowDesc: { color: '#8B8D97', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  tamanoRow: { flexDirection: 'row', gap: 8 },
  tamanoChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  tamanoText: { color: '#8B8D97', fontSize: 12 },
  tamanoTextActiva: { color: '#fff', fontWeight: '600' },
  diaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2A2B31', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, marginBottom: 8 },
  diaHandle: { color: '#8B8D97', fontSize: 16 },
  diaNombre: { color: '#ECE8DE', fontSize: 13, fontWeight: '600' },
});