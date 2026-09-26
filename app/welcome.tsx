import { useTheme } from '../lib/theme';
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function Welcome() {
  const { accent } = useTheme();
  const { nombre } = useLocalSearchParams<{ nombre?: string }>();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  function continuar() {
    router.replace('/');
  }

  return (
    <Pressable style={styles.container} onPress={continuar}>
      <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeIcon}>💪</Text>
        </View>
        <Text style={styles.title}>Bienvenido, {nombre || 'atleta'}</Text>
        <Text style={styles.hint}>TOCA PARA CONTINUAR</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B', alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  badgeIcon: { fontSize: 28 },
  title: { color: '#ECE8DE', fontSize: 20, fontWeight: '900' },
  hint: { color: '#8B8D97', fontSize: 11, marginTop: 12, letterSpacing: 1 },
});