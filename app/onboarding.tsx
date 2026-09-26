import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';

const PASOS = [
  { key: 'nombre', pregunta: '¿Cuál es tu nombre?', placeholder: 'Tu nombre', tipo: 'texto' },
  { key: 'peso', pregunta: '¿Cuánto pesas?', placeholder: '78 kg', tipo: 'numero' },
  { key: 'edad', pregunta: '¿Cuál es tu edad?', placeholder: '24', tipo: 'numero' },
  { key: 'altura', pregunta: '¿Cuál es tu altura?', placeholder: '178 cm', tipo: 'numero' },
  { key: 'nivel', pregunta: '¿Cuál es tu nivel?', tipo: 'nivel' },
] as const;

export default function Onboarding() {
  const { accent } = useTheme()
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState({ nombre: '', peso: '', edad: '', altura: '', nivel: 'intermedio' });
  const [guardando, setGuardando] = useState(false);

  const actual = PASOS[paso];

  function actualizar(valor: string) {
    setDatos((prev) => ({ ...prev, [actual.key]: valor }));
  }

  async function siguiente() {
    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
      return;
    }
    setGuardando(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      await supabase.from('profiles').update({
        nombre: datos.nombre,
        peso: datos.peso ? Number(datos.peso) : null,
        edad: datos.edad ? Number(datos.edad) : null,
        altura: datos.altura ? Number(datos.altura) : null,
        nivel: datos.nivel,
      }).eq('id', userId);
    }
        setGuardando(false);
    router.replace({ pathname: '/welcome', params: { nombre: datos.nombre } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {PASOS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= paso && { backgroundColor: accent }]} />
        ))}
      </View>

      <Text style={styles.title}>{actual.pregunta}</Text>
      <Text style={styles.sub}>Paso {paso + 1} de {PASOS.length}</Text>

      {actual.tipo === 'nivel' ? (
        <View style={styles.nivelRow}>
          {(['principiante', 'intermedio', 'experimentado'] as const).map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.nivelOpt, datos.nivel === n && { borderColor: accent, backgroundColor: accent + '1F' }]}
              onPress={() => actualizar(n)}
            >
              <Text style={[styles.nivelText, datos.nivel === n && styles.nivelTextSel]}>
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          placeholder={actual.placeholder}
          placeholderTextColor="#8B8D97"
          value={(datos as any)[actual.key]}
          onChangeText={actualizar}
          keyboardType={actual.tipo === 'numero' ? 'numeric' : 'default'}
        />
      )}

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={[styles.button, { backgroundColor: accent }]} onPress={siguiente} disabled={guardando}>
        <Text style={styles.buttonText}>{paso === PASOS.length - 1 ? 'Terminar' : 'Siguiente'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B', padding: 24, paddingTop: 60 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotOn: { backgroundColor: '#E1483C' },
  title: { color: '#ECE8DE', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  sub: { color: '#8B8D97', fontSize: 13, marginBottom: 24 },
  input: {
    backgroundColor: '#2A2B31', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    color: '#ECE8DE', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  nivelRow: { flexDirection: 'row', gap: 8 },
  nivelOpt: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nivelOptSel: { borderColor: '#E1483C', backgroundColor: 'rgba(225,72,60,0.12)' },
  nivelText: { color: '#8B8D97', fontSize: 12, fontWeight: '600' },
  nivelTextSel: { color: '#ECE8DE' },
  button: { backgroundColor: '#E1483C', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});