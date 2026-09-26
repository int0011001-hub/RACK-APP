import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { accent } = useTheme();
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
  if (!email || !password) {
    Alert.alert('Faltan datos', 'Escribe tu email y tu contraseña.');
    return;
  }
  setCargando(true);
  const { error } =
    modo === 'entrar'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
  setCargando(false);
  if (error) {
    Alert.alert('Ha ocurrido un error', error.message);
    return;
  }
  router.replace('/');
}

  async function handleGoogleLogin() {
    const redirectTo = Linking.createURL('login');
    console.log('Redirect URL:', redirectTo); // lo vas a necesitar en el paso 4

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      Alert.alert('Error', error?.message ?? 'No se pudo iniciar el proceso.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      const code = new URL(result.url).searchParams.get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) Alert.alert('Error', exErr.message);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RACK</Text>
      <Text style={styles.subtitle}>
        {modo === 'entrar' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8B8D97"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#8B8D97"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: accent }]} onPress={handleSubmit} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.buttonText}>{modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')}>
        <Text style={styles.switchText}>
          {modo === 'entrar' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B', justifyContent: 'center', padding: 24 },
  title: { color: '#ECE8DE', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#8B8D97', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#2A2B31', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: '#ECE8DE', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  button: { backgroundColor: '#E1483C', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  switchText: { color: '#8B8D97', textAlign: 'center', marginTop: 18, fontSize: 13 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 24 },
  googleButton: { backgroundColor: '#2A2B31', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  googleButtonText: { color: '#ECE8DE', fontWeight: '600', fontSize: 15 },
});