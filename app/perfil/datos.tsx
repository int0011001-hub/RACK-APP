import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function DatosBasicos() {
  const [nombre, setNombre] = useState('');
  const [peso, setPeso] = useState('');
  const [edad, setEdad] = useState('');
  const [altura, setAltura] = useState('');
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
    const { data } = await supabase.from('profiles').select('nombre, peso, edad, altura').eq('id', uid).single();
    if (data) {
      setNombre(data.nombre ?? '');
      setPeso(data.peso?.toString() ?? '');
      setEdad(data.edad?.toString() ?? '');
      setAltura(data.altura?.toString() ?? '');
    }
  }

  async function guardarCampo(campo: string, valor: string, esNumero: boolean) {
    if (!userId) return;
    await supabase.from('profiles').update({ [campo]: esNumero ? (valor ? Number(valor) : null) : valor }).eq('id', userId);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Datos básicos</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={(v) => { setNombre(v); guardarCampo('nombre', v, false); }}
          placeholder="Tu nombre"
          placeholderTextColor="#8B8D97"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Medidas</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Peso (kg)</Text>
            <TextInput style={styles.inputSmall} keyboardType="numeric" value={peso} onChangeText={(v) => { setPeso(v); guardarCampo('peso', v, true); }} />
          </View>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Edad</Text>
            <TextInput style={styles.inputSmall} keyboardType="numeric" value={edad} onChangeText={(v) => { setEdad(v); guardarCampo('edad', v, true); }} />
          </View>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Altura (cm)</Text>
            <TextInput style={styles.inputSmall} keyboardType="numeric" value={altura} onChangeText={(v) => { setAltura(v); guardarCampo('altura', v, true); }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 20 },
  title: { color: '#ECE8DE', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  section: { backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  label: { color: '#8B8D97', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  input: { color: '#ECE8DE', backgroundColor: '#17181B', borderRadius: 8, padding: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  miniLabel: { color: '#8B8D97', fontSize: 10, marginBottom: 4 },
  inputSmall: { color: '#ECE8DE', backgroundColor: '#17181B', borderRadius: 8, padding: 10, textAlign: 'center', fontFamily: undefined },
});