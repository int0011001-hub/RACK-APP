import { useState, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme';

const TAMANOS = [
  { id: 'compacto', label: 'Compacto' },
  { id: 'normal', label: 'Normal' },
  { id: 'grande', label: 'Grande' },
] as const;

export default function EditorRutina() {
  const { accent, bg, surface, border } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tituloRutina, setTituloRutina] = useState('');
  const [mostrarRir, setMostrarRir] = useState(true);
  const [mostrarTipoSerie, setMostrarTipoSerie] = useState(true);
  const [tamanoHoja, setTamanoHoja] = useState<'compacto' | 'normal' | 'grande'>('normal');

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  async function cargar() {
    const { data: rutina } = await supabase.from('rutina').select('*').eq('id', id).single();
    setTituloRutina(rutina?.titulo ?? '');
    setMostrarRir(rutina?.mostrar_rir ?? true);
    setTamanoHoja((rutina?.tamano_hoja as any) ?? 'normal');

    const localTipoSerie = await AsyncStorage.getItem(`mostrar_tipo_serie_${id}`);
    if (rutina?.mostrar_tipo_serie !== undefined) {
      setMostrarTipoSerie(rutina.mostrar_tipo_serie);
    } else if (localTipoSerie !== null) {
      setMostrarTipoSerie(localTipoSerie === 'true');
    } else {
      setMostrarTipoSerie(true);
    }
  }

  async function toggleRir(valor: boolean) {
    setMostrarRir(valor);
    await supabase.from('rutina').update({ mostrar_rir: valor }).eq('id', id);
  }

  async function toggleTipoSerie(valor: boolean) {
    setMostrarTipoSerie(valor);
    await AsyncStorage.setItem(`mostrar_tipo_serie_${id}`, String(valor));
    try {
      await supabase.from('rutina').update({ mostrar_tipo_serie: valor }).eq('id', id);
    } catch {
      // Ignorar si la columna aún no está en Supabase
    }
  }

  async function elegirTamano(t: 'compacto' | 'normal' | 'grande') {
    setTamanoHoja(t);
    await supabase.from('rutina').update({ tamano_hoja: t }).eq('id', id);
  }

  async function confirmarEliminarRutina() {
    const { data: diasRow } = await supabase.from('dia').select('id').eq('rutina_id', id);
    const diaIds = (diasRow ?? []).map((d: any) => d.id);
    let count = 0;
    if (diaIds.length) {
      const { count: c } = await supabase
        .from('ejercicio_dia')
        .select('id', { count: 'exact', head: true })
        .in('dia_id', diaIds)
        .eq('activo', true);
      count = c ?? 0;
    }

    Alert.alert(
      '¿Eliminar rutina?',
      count > 0
        ? `Se eliminará "${tituloRutina?.trim() || 'esta rutina'}" junto con todos sus días, ejercicios e historial registrado.`
        : `¿Seguro que quieres eliminar "${tituloRutina?.trim() || 'esta rutina'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('rutina').delete().eq('id', id);
            router.replace('/');
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={16} color="#8B8D97" />
        <Text style={styles.back}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Modo editor</Text>
      <Text style={styles.sub}>Estos ajustes solo afectan a esta rutina.</Text>

      {/* Ajustes de registro */}
      <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Mostrar RIR</Text>
            <Text style={styles.rowDesc}>Añade un campo para anotar cuántas repeticiones te quedaban en el tanque.</Text>
          </View>
          <Switch value={mostrarRir} onValueChange={toggleRir} trackColor={{ false: '#17181B', true: accent }} thumbColor="#ECE8DE" />
        </View>

        <View style={[styles.row, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: border }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Seleccionar tipo de serie</Text>
            <Text style={styles.rowDesc}>Permite elegir entre serie recta o multi-tramo (drop sets, rest-pause, etc.).</Text>
          </View>
          <Switch value={mostrarTipoSerie} onValueChange={toggleTipoSerie} trackColor={{ false: '#17181B', true: accent }} thumbColor="#ECE8DE" />
        </View>
      </View>

      {/* Tamaño de las hojas */}
      <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
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

      {/* Zona de peligro: Eliminar rutina */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={confirmarEliminarRutina}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={17} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={styles.deleteText}>Eliminar rutina</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  back: { color: '#8B8D97', fontSize: 14, fontWeight: '500' },
  title: { color: '#ECE8DE', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  sub: { color: '#8B8D97', fontSize: 12, marginBottom: 20 },
  section: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: '#ECE8DE', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  rowDesc: { color: '#8B8D97', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  tamanoRow: { flexDirection: 'row', gap: 8 },
  tamanoChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  tamanoText: { color: '#8B8D97', fontSize: 12 },
  tamanoTextActiva: { color: '#fff', fontWeight: '600' },
  footer: { marginTop: 24, marginBottom: 20 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.45)',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
  },
});