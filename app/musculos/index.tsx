import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Body from 'react-native-body-highlighter';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useTheme } from '../../lib/theme';

type Ejercicio = { nombre: string; grupo_muscular: string[] | null };

export default function Musculos() {
  const { accent } = useTheme();
  const [vista, setVista] = useState<'front' | 'back'>('front');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [ejerciciosDelGrupo, setEjerciciosDelGrupo] = useState<Ejercicio[]>([]);
  const [gruposConEjercicios, setGruposConEjercicios] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      cargarGruposDisponibles();
    }, [])
  );

  async function cargarGruposDisponibles() {
    const { data } = await supabase.from('catalogo_ejercicio').select('grupo_muscular');
    const set = new Set<string>();
    (data ?? []).forEach((row: any) => {
      (row.grupo_muscular ?? []).forEach((g: string) => set.add(g));
    });
    setGruposConEjercicios(set);
  }

  async function tocarGrupo(slug: string) {
    if (!gruposConEjercicios.has(slug)) return; // sin ejercicios todavía: no reacciona
    setGrupoSeleccionado(grupoSeleccionado === slug ? null : slug);
    if (grupoSeleccionado !== slug) {
      const { data } = await supabase
        .from('catalogo_ejercicio')
        .select('nombre, grupo_muscular')
        .contains('grupo_muscular', [slug]);
      setEjerciciosDelGrupo(data ?? []);
    }
  }

  const dataBody = Array.from(gruposConEjercicios).map((slug) => ({
    slug,
    intensity: grupoSeleccionado === slug ? 2 : 1,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text style={styles.title}>Buscar por músculo</Text>
        <Text style={styles.sub}>Toca una zona con ejercicios para verlos.</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, vista === 'front' && { backgroundColor: accent, borderColor: accent }]} onPress={() => setVista('front')}>
            <Text style={[styles.tabText, vista === 'front' && styles.tabTextActiva]}>Frontal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, vista === 'back' && { backgroundColor: accent, borderColor: accent }]} onPress={() => setVista('back')}>
            <Text style={[styles.tabText, vista === 'back' && styles.tabTextActiva]}>Trasera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyWrap}>
          <Body
            data={dataBody as any}
            gender="male"
            side={vista}
            scale={1.6}
            colors={[accent, '#ECE8DE']}
            onBodyPartPress={(e: any) => tocarGrupo(e.slug)}
          />
        </View>

        {grupoSeleccionado && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>{grupoSeleccionado}</Text>
            {ejerciciosDelGrupo.length === 0 ? (
              <Text style={styles.sinDatos}>Próximamente ejercicios para esta zona.</Text>
            ) : (
              ejerciciosDelGrupo.map((e, i) => (
                <Text key={i} style={styles.ejercicioRow}>{e.nombre}</Text>
              ))
            )}
          </View>
        )}
      </ScrollView>
      <BottomNav active="musculos" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#17181B' },
  title: { color: '#ECE8DE', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sub: { color: '#8B8D97', fontSize: 12, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  tabActiva: { backgroundColor: '#E1483C', borderColor: '#E1483C' },
  tabText: { color: '#8B8D97', fontSize: 12 },
  tabTextActiva: { color: '#fff', fontWeight: '600' },
  bodyWrap: { alignItems: 'center', marginBottom: 16 },
  resultBox: { backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  resultTitle: { color: '#8B8D97', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  sinDatos: { color: '#8B8D97', fontSize: 12 },
  ejercicioRow: { color: '#ECE8DE', fontSize: 13, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
});