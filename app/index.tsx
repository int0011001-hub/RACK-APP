import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import BottomNav from '../components/BottomNav';

type Rutina = { id: string; titulo: string };

export default function Index() {
  const { accent, gradient, bg, surface, border } = useTheme();
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

  if (cargando) {
    return (
      <View style={[styles.loading, { backgroundColor: bg }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;
  if (!tieneNombre) return <Redirect href="/onboarding" />;

  if (!rutinasCargadas) {
    return (
      <View style={[styles.loading, { backgroundColor: bg }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={styles.content}>
        {/* Cabecera con botón + en círculo para crear rutinas */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Mis rutinas</Text>
            <Text style={styles.subtitle}>Selecciona un plan para empezar tu sesión</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/rutina/nueva')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addRoutineCircle}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {rutinas.length === 0 ? (
          <TouchableOpacity
            style={styles.empty}
            onPress={() => router.push('/rutina/nueva')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyAddCircle}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Aún no tienes rutinas</Text>
            <Text style={[styles.emptyText, { color: accent }]}>Toca aquí para crear tu primera rutina</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={rutinas}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 25 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: surface, borderColor: border }]}
                  onPress={() => router.push(`/rutina/${item.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Franja superior de portada con degradado del tema */}
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardStripe}
                  />

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardBadge}>
                        <Text style={[styles.cardTag, { color: accent }]}>RUTINA</Text>
                      </View>
                      <Ionicons name="barbell-outline" size={15} color="rgba(255,255,255,0.3)" />
                    </View>

                    {/* Título de la rutina profesional y bien visible */}
                    <Text style={styles.cardTitle} numberOfLines={3}>
                      {item.titulo?.trim() || 'Rutina sin título'}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardFooterText}>Entrenar</Text>
                      <Ionicons name="arrow-forward" size={12} color={accent} />
                    </View>
                  </View>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1 },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    color: '#ECE8DE',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8B8D97',
    fontSize: 12,
    marginTop: 2,
  },
  addRoutineCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyAddCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  emptyTitle: { color: '#ECE8DE', fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, fontWeight: '600' },
  cardWrap: { flex: 1 },
  card: {
    minHeight: 125,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardStripe: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTitle: {
    color: '#ECE8DE',
    fontSize: 17, // Texto profesional y grande
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardFooterText: {
    color: '#8B8D97',
    fontSize: 11,
    fontWeight: '600',
  },
});