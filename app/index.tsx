import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import BottomNav from '../components/BottomNav';

type Rutina = { id: string; titulo: string };

export default function Index() {
  const { accent } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [tieneNombre, setTieneNombre] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [rutinasCargadas, setRutinasCargadas] = useState(false);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);

  useEffect(() => {
    async function cargarInicial() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        const [perfilRes, rutinasRes] = await Promise.all([
          supabase.from('profiles').select('nombre').eq('id', data.session.user.id).single(),
          supabase.from('rutina').select('id, titulo').eq('usuario_id', data.session.user.id).order('created_at', { ascending: true }),
        ]);
        setTieneNombre(!!perfilRes.data?.nombre);
        setRutinas(rutinasRes.data ?? []);
        setRutinasCargadas(true);
      }
      setCargando(false);
    }
    cargarInicial();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const cargarRutinas = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('rutina')
      .select('id, titulo')
      .eq('usuario_id', session.user.id)
      .order('created_at', { ascending: true });
    setRutinas(data ?? []);
    setRutinasCargadas(true);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (session) {
        cargarRutinas();
      }
    }, [session, cargarRutinas])
  );

  async function confirmarBorrarRutina(id: string, titulo: string) {
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
    if (!count) {
      borrarRutina(id);
      return;
    }
    Alert.alert(
      '¿Estás seguro?',
      `Se eliminará "${titulo?.trim() || 'esta rutina'}" junto con todos sus días, ejercicios e historial.`,
      [
        {text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrarRutina(id) },
      ]
    );
  }  

  async function borrarRutina(id: string) {
    await supabase.from('rutina').delete().eq('id', id);
    setRutinas((prev) => prev.filter((r) => r.id !== id));
  }

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;
  if (!tieneNombre) return <Redirect href="/onboarding" />;

  if (!rutinasCargadas) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Mis rutinas</Text>

        {rutinas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aún no tienes rutinas</Text>
            <Text style={styles.emptyText}>Toca + para crear la primera.</Text>
          </View>
        ) : (
          <FlatList
            data={rutinas}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <TouchableOpacity style={styles.card} onPress={() => router.push(`/rutina/${item.id}`)}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.titulo?.trim() || 'Rutina sin título'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardDelete} onPress={() => confirmarBorrarRutina(item.id, item.titulo)}>
                  <Text style={styles.cardDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
      <BottomNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#17181B', alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: '#17181B' },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  title: { color: '#ECE8DE', fontSize: 18, fontWeight: '900', marginBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { color: '#ECE8DE', fontSize: 14, fontWeight: '600' },
  emptyText: { color: '#8B8D97', fontSize: 12 },
  cardWrap: { flex: 1 },
  card: {
    minHeight: 70, backgroundColor: '#2A2B31', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, justifyContent: 'center',
  },
  cardTitle: { color: '#ECE8DE', fontSize: 13, fontWeight: '600' },
  cardDelete: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  cardDeleteText: { color: '#8B8D97', fontSize: 10 },
});