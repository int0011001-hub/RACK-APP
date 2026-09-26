import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { TEMAS, useTheme } from '../../lib/theme';

const ETIQUETAS: Record<string, string> = {
  rojo: 'Rojo · 25kg',
  azul: 'Azul · 20kg',
  amarillo: 'Amarillo · 15kg',
  verde: 'Verde · 10kg',
};

export default function Apariencia() {
  const { temaId, setTema } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Apariencia</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color de acento</Text>
        <Text style={styles.desc}>Se usa en botones, pestañas y gráficas de toda la app.</Text>

        <View style={styles.grid}>
          {Object.entries(TEMAS).map(([id, hex]) => (
            <TouchableOpacity
              key={id}
              style={[styles.swatch, temaId === id && { borderColor: hex, backgroundColor: hex + '1A' }]}
              onPress={() => setTema(id as any)}
            >
              <View style={[styles.dot, { backgroundColor: hex }]} />
              <Text style={styles.swatchText}>{ETIQUETAS[id]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 20 },
  title: { color: '#ECE8DE', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  section: { backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: '#8B8D97', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  desc: { color: '#8B8D97', fontSize: 12, marginBottom: 14, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12,
  },
  dot: { width: 18, height: 18, borderRadius: 9 },
  swatchText: { color: '#ECE8DE', fontSize: 12 },
});