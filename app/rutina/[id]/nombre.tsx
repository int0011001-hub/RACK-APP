import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme';

export default function NombreRutina() {
  const { accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [titulo, setTitulo] = useState('');

  async function guardarYContinuar() {
    await supabase.from('rutina').update({ titulo }).eq('id', id);
    router.replace(`/rutina/${id}`);
  }

  function actualizarTitulo(valor: string) {
    setTitulo(valor);
    supabase.from('rutina').update({ titulo: valor }).eq('id', id).then(undefined, (err) => {
      console.warn('Error al actualizar título:', err);
    });
  }

  async function volver() {
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
    if (count === 0 && !titulo.trim()) {
      await supabase.from('rutina').delete().eq('id', id);
      router.replace('/');
    } else {
      router.replace(`/rutina/${id}`);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={volver}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Dale nombre a la rutina</Text>
      <Text style={styles.sub}>Podrás cambiarlo cuando quieras.</Text>

      <TextInput
        style={styles.input}
        placeholder="Ej. Fuerza · Torso/Pierna"
        placeholderTextColor="#8B8D97"
        value={titulo}
        onChangeText={actualizarTitulo}
        autoFocus
      />

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={[styles.button, { backgroundColor: accent }]} onPress={guardarYContinuar}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B', padding: 24, paddingTop: 60 },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 24 },
  title: { color: '#ECE8DE', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  sub: { color: '#8B8D97', fontSize: 13, marginBottom: 20 },
  input: {
    backgroundColor: '#2A2B31', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    color: '#ECE8DE', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});