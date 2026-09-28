import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';

type Props = {
  active?: 'home' | 'musculos' | 'perfil';
};

export default function BottomNav({ active }: Props) {
  const insets = useSafeAreaInsets();
  const { accent, gradient, surface, border } = useTheme();

  return (
    <View style={[styles.navbar, { backgroundColor: surface, borderTopColor: border, paddingBottom: 14 + insets.bottom }]}>
      <TouchableOpacity
        onPress={() => {
          if (active !== 'home') router.replace('/');
        }}
      >
        <Ionicons name="home" size={22} color={active === 'home' ? accent : '#8B8D97'} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (active !== 'musculos') router.replace('/musculos');
        }}
      >
        <Ionicons name="body" size={22} color={active === 'musculos' ? accent : 'rgba(139,141,151,0.4)'} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Alert.alert('Próximamente', 'Chat y mensajes entre usuarios.')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.plusButton}
        >
          <Ionicons name="chatbubbles" size={21} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert('Próximamente', 'Tabla de puntuación entre usuarios.')}>
        <Ionicons name="trophy" size={22} color="rgba(139,141,151,0.4)" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (active !== 'perfil') router.replace('/perfil');
        }}
      >
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
    borderTopWidth: 1,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});