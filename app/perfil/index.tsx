import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useTheme } from '../../lib/theme';

export default function Perfil() {
  const { accent } = useTheme();
  const [nombre, setNombre] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [handleMsg, setHandleMsg] = useState('');
  const [handleOk, setHandleOk] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fondoUrl, setFondoUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  async function cargarPerfil() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    setUserId(uid);
    const { data } = await supabase
      .from('profiles')
      .select('nombre, handle, bio, foto_url, fondo_url')
      .eq('id', uid)
      .single();
    if (data) {
      setNombre(data.nombre ?? '');
      setHandle(data.handle ?? '');
      setBio(data.bio ?? '');
      setFotoUrl(data.foto_url ?? null);
      setFondoUrl(data.fondo_url ?? null);
      if (data.handle) validarHandle(data.handle, uid, false);
    }
  }

  async function validarHandle(valor: string, uid: string, guardar: boolean) {
    const limpio = valor.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (limpio !== handle) setHandle(limpio);

    if (!limpio) {
      setHandleMsg('Elige un @usuario único para tu perfil.');
      setHandleOk(null);
      return;
    }
    if (limpio.length < 3) {
      setHandleMsg('Mínimo 3 caracteres.');
      setHandleOk(false);
      return;
    }

    const { data: existente } = await supabase
      .from('profiles')
      .select('id')
      .ilike('handle', limpio)
      .neq('id', uid)
      .maybeSingle();

    if (existente) {
      setHandleMsg(`@${limpio} ya está en uso, prueba otro.`);
      setHandleOk(false);
      return;
    }

    setHandleMsg(`@${limpio} está disponible.`);
    setHandleOk(true);

    if (guardar) {
      await supabase.from('profiles').update({ handle: limpio }).eq('id', uid);
    }
  }

  function onHandleChange(valor: string) {
    if (!userId) return;
    validarHandle(valor, userId, true);
  }

  async function onBioChange(valor: string) {
    setBio(valor);
    if (userId) await supabase.from('profiles').update({ bio: valor }).eq('id', userId);
  }

  async function subirImagen(tipo: 'avatar' | 'cover') {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para esto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: tipo === 'avatar' ? [1, 1] : [16, 9],
    });
    if (resultado.canceled || !resultado.assets[0].base64 || !userId) return;

    const path = `${userId}/${tipo}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(path, decode(resultado.assets[0].base64), { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      Alert.alert('Error al subir la imagen', uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('profile-media').getPublicUrl(path);
    const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const campo = tipo === 'avatar' ? 'foto_url' : 'fondo_url';
    await supabase.from('profiles').update({ [campo]: url }).eq('id', userId);
    if (tipo === 'avatar') setFotoUrl(url);
    else setFondoUrl(url);
  }

  function confirmarCerrarSesion() {
    Alert.alert('¿Cerrar sesión?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.cover} onPress={() => subirImagen('cover')}>
          {fondoUrl && <Image source={{ uri: fondoUrl }} style={StyleSheet.absoluteFill} />}
          <Text style={styles.coverEditText}>🖼 Cambiar fondo</Text>
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={() => subirImagen('avatar')}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{nombre ? nombre.charAt(0).toUpperCase() : '?'}</Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: accent }]}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, paddingTop: 8 }}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.nombre, !nombre && styles.nombrePlaceholder]}
              onPress={() => router.push('/perfil/datos')}
            >
              {nombre || 'Toca para añadir tu nombre'}
            </Text>
          </View>

          <View style={styles.handleRow}>
            <Text style={styles.at}>@</Text>
            <TextInput
              style={styles.handleInput}
              placeholder="usuario"
              placeholderTextColor="#8B8D97"
              value={handle}
              onChangeText={onHandleChange}
              autoCapitalize="none"
            />
          </View>
          <Text style={[styles.handleMsg, handleOk === true && styles.ok, handleOk === false && styles.err]}>
            {handleMsg}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre mí</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Cuéntanos algo sobre ti: tus objetivos, tu estilo de entreno..."
              placeholderTextColor="#8B8D97"
              value={bio}
              onChangeText={onBioChange}
              multiline
              maxLength={140}
            />
            <Text style={styles.counter}>{bio.length}/140</Text>
          </View>

        <Text style={styles.sectionTitle}>Ajustes</Text>
        <View style={styles.settingsList}>
          <Text style={styles.settingsRow} onPress={() => router.push('/perfil/datos')}>
            Datos básicos  ›
          </Text>
          <Text style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.push('/perfil/apariencia')}>
            Apariencia  ›
          </Text>
          <Text style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.push('/perfil/estilo')}>
            Estilo de registro  ›
          </Text>
          <Text style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.push('/perfil/hoja')}>
            Estilo de hoja  ›
          </Text>
        </View>

          <TouchableOpacity style={styles.signOutButton} onPress={confirmarCerrarSesion}>
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav active="perfil" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  cover: {
    height: 110, backgroundColor: '#2A2B31', marginTop: 50,
    alignItems: 'flex-end', justifyContent: 'flex-end', padding: 10, overflow: 'hidden',
  },
  coverEditText: { color: '#ECE8DE', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  avatarWrap: { alignItems: 'center', marginTop: -38 },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#17181B' },
  avatarPlaceholder: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#2A2B31', borderWidth: 3, borderColor: '#17181B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#8B8D97', fontSize: 24, fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#E1483C',
    borderWidth: 2, borderColor: '#17181B', alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { color: '#fff', fontSize: 11 },
  nameRow: { alignItems: 'center', marginBottom: 8 },
  nombre: { color: '#ECE8DE', fontSize: 18, fontWeight: '900' },
  nombrePlaceholder: { color: '#8B8D97', fontWeight: '500', fontStyle: 'italic', fontSize: 14 },
  handleRow: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#2A2B31',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  at: { color: '#8B8D97', fontSize: 14 },
  handleInput: { color: '#ECE8DE', fontSize: 14, minWidth: 100, padding: 0 },
  handleMsg: { color: '#8B8D97', fontSize: 11, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  ok: { color: '#4C8C5B' },
  err: { color: '#E1483C' },
  section: {
    backgroundColor: '#2A2B31', borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: { color: '#8B8D97', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  bioInput: { color: '#ECE8DE', fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  counter: { color: '#8B8D97', fontSize: 10, textAlign: 'right', marginTop: 4 },
  settingsList: { backgroundColor: '#2A2B31', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  settingsRow: { color: '#ECE8DE', fontSize: 13, fontWeight: '500', padding: 14 },
  signOutButton: { marginTop: 20, alignItems: 'center', paddingVertical: 12 },
  signOutText: { color: '#E1483C', fontSize: 13, fontWeight: '600' },
});