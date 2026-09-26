import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

type Props = {
  active?: 'home' | 'musculos' | 'perfil';
};

export default function BottomNav({ active }: Props) {
  const insets = useSafeAreaInsets();
  const { accent } = useTheme();

  return (
    <View style={[styles.navbar, { paddingBottom: 14 + insets.bottom }]}>
      <TouchableOpacity onPress={() => router.replace('/')}>
        <Ionicons name="home" size={22} color={active === 'home' ? accent : '#8B8D97'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/musculos')}>
        <Ionicons name="body" size={22} color={active === 'musculos' ? accent : 'rgba(139,141,151,0.4)'} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.plusButton, { backgroundColor: accent }]} onPress={() => router.push('/rutina/nueva')}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert('Próximamente', 'Tabla de puntuación entre usuarios.')}>
        <Ionicons name="trophy" size={22} color="rgba(139,141,151,0.4)" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/perfil')}>
        <Ionicons name="person" size={22} color={active === 'perfil' ? accent : 'rgba(139,141,151,0.4)'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    backgroundColor: '#2A2B31',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  plusButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginTop: -24,
  },
});