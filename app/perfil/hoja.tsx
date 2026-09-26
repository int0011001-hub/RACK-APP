import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

export default function EstiloHoja() {
  const { accent } = useTheme();
  const [actual, setActual] = useState<string>('oscura');
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    setUserId(uid);
    const { data } = await supabase.from('profiles').select('estilo_hoja').eq('id', uid).single();
    if (data?.estilo_hoja) setActual(data.estilo_hoja);
  }

  async function elegir(id: string) {
    setActual(id);
    if (userId) await supabase.from('profiles').update({ estilo_hoja: id }).eq('id', userId);
  }

  const opciones = [
    { id: 'oscura', label: 'Oscura', desc: 'La hoja mantiene el mismo fondo oscuro que el resto de la app.' },
    { id: 'clara', label: 'Clara', desc: 'La hoja se ve como papel real: fondo blanco, texto oscuro.' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Estilo de hoja</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Solo afecta al estilo "Bloc de notas"</Text>
        {opciones.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[styles.option, actual === o.id && { borderColor: accent, backgroundColor: accent + '1A' }]}
            onPress={() => elegir(o.id)}
          >
            <Text style={styles.optionTitle}>{o.label}</Text>
            <Text style={styles.optionDesc}>{o.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 20 },
  title: { color: '#ECE8DE', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  section: { backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: '#8B8D97', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  option: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, marginBottom: 10 },
  optionTitle: { color: '#ECE8DE', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  optionDesc: { color: '#8B8D97', fontSize: 11, lineHeight: 16 },
});