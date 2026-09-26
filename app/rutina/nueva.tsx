import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

export default function NuevaRutina() {
  const { accent } = useTheme();
  useEffect(() => {
    crear();
  }, []);

  async function crear() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: rutina, error } = await supabase
      .from('rutina')
      .insert({ usuario_id: userId, titulo: '' })
      .select('id')
      .single();

    if (error || !rutina) {
      router.back();
      return;
    }

    await supabase.from('dia').insert({ rutina_id: rutina.id, nombre: 'Día 1', orden: 1 });

    router.replace(`/rutina/${rutina.id}/nombre`);
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B', alignItems: 'center', justifyContent: 'center' },
});