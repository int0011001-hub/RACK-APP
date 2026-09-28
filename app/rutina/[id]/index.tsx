import Svg, { Path, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import React from 'react';
import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme';

type Dia = { id: string; nombre: string; orden: number };
const EJERCICIOS_1RM = new Set(['press banca', 'sentadilla', 'peso muerto', 'press militar']);

type TipoSerie = 'recta' | 'multitramo';
type Tramo = { id: string; orden: number; kg: string; reps: string };
type Serie = { id: string; numero_serie: number; tipo_serie: TipoSerie; rir: string; tramos: Tramo[] };
type Ejercicio = { id: string; nombre: string; series: Serie[] };
type PuntoProgreso = { fecha: string; valor: number; seriesCount: number };
const ESCALAS: Record<string, number> = { compacto: 0.85, normal: 1, grande: 1.15 };

function generarId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const TIPOS_SERIE: { value: TipoSerie; label: string }[] = [
  { value: 'recta', label: 'Recta' },
  { value: 'multitramo', label: 'Multi-tramo' },
];

export default function RutinaDetalle() {
  const { accent, bg, surface, border } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [titulo, setTitulo] = useState('');
  const [dias, setDias] = useState<Dia[]>([]);
  const [diaActivoId, setDiaActivoId] = useState<string | null>(null);
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState<Record<string, Ejercicio[]>>({});
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [progresoAbierto, setProgresoAbierto] = useState<string | null>(null);
  const [metricaProgreso, setMetricaProgreso] = useState<'1rm' | 'volumen'>('1rm');
  const [datosProgreso, setDatosProgreso] = useState<PuntoProgreso[]>([]);
  const [estiloRegistro, setEstiloRegistro] = useState<'acordeon' | 'notas'>('acordeon');
  const [estiloHoja, setEstiloHoja] = useState<'oscura' | 'clara'>('oscura');
  const [mostrarRir, setMostrarRir] = useState(true);
  const [mostrarTipoSerie, setMostrarTipoSerie] = useState(true);
  const [tamanoHoja, setTamanoHoja] = useState<'compacto' | 'normal' | 'grande'>('normal');
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [tipoSelectorAbierto, setTipoSelectorAbierto] = useState<string | null>(null);

  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloTemp, setTituloTemp] = useState('');
  const [editandoDiaId, setEditandoDiaId] = useState<string | null>(null);
  const [nombreDiaTemp, setNombreDiaTemp] = useState('');
  const [editandoEjercicioId, setEditandoEjercicioId] = useState<string | null>(null);
  const [nombreEjercicioTemp, setNombreEjercicioTemp] = useState('');

  const ejercicios = diaActivoId ? (ejerciciosPorDia[diaActivoId] ?? []) : [];
  const diaCargado = diaActivoId ? ejerciciosPorDia[diaActivoId] !== undefined : true;
  const escala = ESCALAS[tamanoHoja] ?? 1;

  const hojaClara = estiloHoja === 'clara';
  const hojaBg = hojaClara ? '#F5F2EA' : '#2A2B31';
  const hojaText = hojaClara ? '#2A2A28' : '#ECE8DE';
  const hojaMuted = hojaClara ? '#8A8577' : '#8B8D97';
  const hojaBlankBg = hojaClara ? '#EAE6DA' : '#17181B';
  const hojaBorder = hojaClara ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [id])
  );

  function actualizarListaDia(diaId: string, updater: (lista: Ejercicio[]) => Ejercicio[]) {
    setEjerciciosPorDia((prev) => ({ ...prev, [diaId]: updater(prev[diaId] ?? []) }));
  }

  async function cargarTodo() {
    // 1. Carga paralela de rutina, días y usuario (1 solo round-trip de red)
    const [rutinaRes, diasRes, userRes] = await Promise.all([
      supabase.from('rutina').select('*').eq('id', id).single(),
      supabase.from('dia').select('id, nombre, orden').eq('rutina_id', id).order('orden'),
      supabase.auth.getUser(),
    ]);

    const uid = userRes.data?.user?.id;
    if (uid) {
      supabase.from('profiles').select('estilo_registro, estilo_hoja').eq('id', uid).single().then(({ data: perfil }) => {
        if (perfil?.estilo_registro) setEstiloRegistro(perfil.estilo_registro as any);
        if (perfil?.estilo_hoja) setEstiloHoja(perfil.estilo_hoja as any);
      });
    }

    const rutina = rutinaRes.data;
    setTitulo(rutina?.titulo ?? '');
    setMostrarRir(rutina?.mostrar_rir ?? true);
    setTamanoHoja((rutina?.tamano_hoja as any) ?? 'normal');

    const localTipoSerie = await AsyncStorage.getItem(`mostrar_tipo_serie_${id}`);
    if (rutina?.mostrar_tipo_serie !== undefined) {
      setMostrarTipoSerie(rutina.mostrar_tipo_serie);
    } else if (localTipoSerie !== null) {
      setMostrarTipoSerie(localTipoSerie === 'true');
    } else {
      setMostrarTipoSerie(true);
    }

    const listaDias = diasRes.data ?? [];
    setDias(listaDias);

    const primerDiaId = diaActivoId ?? listaDias[0]?.id ?? null;
    setDiaActivoId(primerDiaId);

    if (primerDiaId) {
      const listaPrimerDia = await obtenerEjerciciosDeDia(primerDiaId);
      setEjerciciosPorDia((prev) => ({ ...prev, [primerDiaId]: listaPrimerDia }));
    }

    // Cargar los demás días en segundo plano
    listaDias.forEach((d) => {
      if (d.id === primerDiaId) return;
      obtenerEjerciciosDeDia(d.id).then((lista) => {
        setEjerciciosPorDia((prev) => ({ ...prev, [d.id]: lista }));
      });
    });
  }

  async function obtenerEjerciciosDeDia(diaId: string): Promise<Ejercicio[]> {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('ejercicio_dia')
      .select('id, orden, fecha_ultimo_registro, catalogo_ejercicio(nombre), serie_actual(id, numero_serie, tipo_serie, rir, tramo_serie(id, orden, kg, reps))')
      .eq('dia_id', diaId)
      .eq('activo', true)
      .order('orden');

    const filas = (data ?? []) as any[];

    // Ejecutar archivado en segundo plano sin retrasar el renderizado visual
    const pendientesDeArchivar = filas.filter(
      (e) => e.fecha_ultimo_registro && e.fecha_ultimo_registro !== hoy
    );
    if (pendientesDeArchivar.length > 0) {
      archivarEjerciciosEnSegundoPlano(pendientesDeArchivar, hoy);
    }

    return filas.map((e) => ({
      id: e.id,
      nombre: e.catalogo_ejercicio?.nombre ?? '',
      series: (e.serie_actual ?? [])
        .sort((a: any, b: any) => a.numero_serie - b.numero_serie)
        .map((s: any) => ({
          id: s.id,
          numero_serie: s.numero_serie,
          tipo_serie: (s.tipo_serie as TipoSerie) ?? 'recta',
          rir: s.rir?.toString() ?? '',
          tramos: (s.tramo_serie ?? [])
            .sort((a: any, b: any) => a.orden - b.orden)
            .map((t: any) => ({ id: t.id, orden: t.orden, kg: t.kg?.toString() ?? '', reps: t.reps?.toString() ?? '' })),
        })),
    }));
  }

  async function archivarEjerciciosEnSegundoPlano(ejerciciosDia: any[], hoy: string) {
    for (const e of ejerciciosDia) {
      const series = e.serie_actual ?? [];
      const tieneDatos = series.some((s: any) =>
        (s.tramo_serie ?? []).some((t: any) => t.kg !== null || t.reps !== null)
      );
      if (tieneDatos) {
        const filasSerie = series.map((s: any) => ({
          ejercicio_dia_id: e.id,
          fecha: e.fecha_ultimo_registro,
          numero_serie: s.numero_serie,
          tipo_serie: s.tipo_serie,
          rir: s.rir,
        }));
        const { data: historialInsertado } = await supabase
          .from('serie_historial')
          .insert(filasSerie)
          .select('id, numero_serie');

        if (historialInsertado) {
          const filasTramo: any[] = [];
          series.forEach((s: any) => {
            const hist = historialInsertado.find((h: any) => h.numero_serie === s.numero_serie);
            const historialId = hist?.id;
            if (!historialId) return;
            (s.tramo_serie ?? []).forEach((t: any) => {
              const parseKg = t.kg !== null && t.kg !== '' ? Number(String(t.kg).replace(',', '.')) : null;
              const parseReps = t.reps !== null && t.reps !== '' ? Number(String(t.reps).replace(',', '.')) : null;
              filasTramo.push({
                serie_historial_id: historialId,
                orden: t.orden,
                kg: isNaN(parseKg as any) ? null : parseKg,
                reps: isNaN(parseReps as any) ? null : parseReps,
              });
            });
          });
          if (filasTramo.length) await supabase.from('tramo_historial').insert(filasTramo);
        }
      }
      await supabase.from('ejercicio_dia').update({ fecha_ultimo_registro: hoy }).eq('id', e.id);
    }
  }

  function seleccionarDia(diaId: string) {
    setDiaActivoId(diaId);
    setAbierto(null);
    if (ejerciciosPorDia[diaId] === undefined) {
      obtenerEjerciciosDeDia(diaId).then((lista) => {
        setEjerciciosPorDia((prev) => ({ ...prev, [diaId]: lista }));
      });
    }
  }

  async function anadirDia() {
    const nuevoNumero = dias.length + 1;
    const nuevoNombre = `Día ${nuevoNumero}`;
    const nuevoOrden = dias.length ? Math.max(...dias.map((d) => d.orden)) + 1 : 1;
    const nuevoId = generarId();
    const nuevoDia: Dia = { id: nuevoId, nombre: nuevoNombre, orden: nuevoOrden };

    // 1. Actualización optimista inmediata (0ms de espera en pantalla)
    setDias((prev) => [...prev, nuevoDia]);
    setEjerciciosPorDia((prev) => ({ ...prev, [nuevoId]: [] }));
    setDiaActivoId(nuevoId);
    setAbierto(null);

    // 2. Persistencia en Supabase
    const { error } = await supabase
      .from('dia')
      .insert({ id: nuevoId, rutina_id: id, nombre: nuevoNombre, orden: nuevoOrden });

    if (error) {
      setDias((prev) => prev.filter((d) => d.id !== nuevoId));
      setEjerciciosPorDia((prev) => {
        const copia = { ...prev };
        delete copia[nuevoId];
        return copia;
      });
      if (dias.length) setDiaActivoId(dias[0].id);
      Alert.alert('Error', 'No se pudo crear el día.');
    }
  }

  async function renombrarDia(diaId: string, nuevoNombre: string) {
    const limpio = nuevoNombre.trim();
    if (!limpio) return;
    await supabase.from('dia').update({ nombre: limpio }).eq('id', diaId);
    setDias((prev) => prev.map((d) => (d.id === diaId ? { ...d, nombre: limpio } : d)));
  }

  async function onDragEndDias({ data }: { data: Dia[] }) {
    setDias(data);
    await Promise.all(data.map((d, i) => supabase.from('dia').update({ orden: i + 1 }).eq('id', d.id)));
  }

  async function confirmarBorrarDia(diaId: string, nombre: string) {
    if (dias.length <= 1) {
      Alert.alert('No se puede borrar', 'Una rutina necesita al menos un día.');
      return;
    }
    const { count } = await supabase
      .from('ejercicio_dia')
      .select('id', { count: 'exact', head: true })
      .eq('dia_id', diaId)
      .eq('activo', true);

    if (!count) {
      borrarDia(diaId);
      return;
    }
    Alert.alert('¿Estás seguro?', `Se eliminará "${nombre}" con todos sus ejercicios.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => borrarDia(diaId) },
    ]);
  }

  async function borrarDia(diaId: string) {
    await supabase.from('dia').delete().eq('id', diaId);
    const nuevos = dias.filter((d) => d.id !== diaId);
    setDias(nuevos);
    setEjerciciosPorDia((prev) => {
      const copia = { ...prev };
      delete copia[diaId];
      return copia;
    });
    if (nuevos.length) seleccionarDia(nuevos[0].id);
  }

  async function buscarEjercicios(texto: string) {
    setBusqueda(texto);
    if (!texto.trim()) {
      setSugerencias([]);
      return;
    }
    const yaEnDia = ejercicios.map((e) => e.nombre.toLowerCase());
    const { data } = await supabase
      .from('catalogo_ejercicio')
      .select('nombre')
      .ilike('nombre', `%${texto}%`)
      .limit(6);
    const filtradas = (data ?? [])
      .map((d) => d.nombre)
      .filter((n) => !yaEnDia.includes(n.toLowerCase()));
    setSugerencias(filtradas);
  }

  async function crearSerieVacia(ejercicioDiaId: string, numero: number): Promise<Serie> {
    const serieId = generarId();
    const tramoId = generarId();
    await supabase
      .from('serie_actual')
      .insert({ id: serieId, ejercicio_dia_id: ejercicioDiaId, numero_serie: numero, tipo_serie: 'recta', rir: null });
    await supabase
      .from('tramo_serie')
      .insert({ id: tramoId, serie_actual_id: serieId, orden: 1, kg: null, reps: null });
    return {
      id: serieId,
      numero_serie: numero,
      tipo_serie: 'recta',
      rir: '',
      tramos: [{ id: tramoId, orden: 1, kg: '', reps: '' }],
    };
  }

  async function anadirEjercicio(nombre: string) {
    if (!diaActivoId || !nombre.trim()) return;
    const nombreLimpio = nombre.trim();
    if (ejercicios.some((e) => e.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
      setBusqueda('');
      setSugerencias([]);
      setMostrarBuscador(false);
      return;
    }

    // 1. Cerrar buscador y sugerencias al instante
    setBusqueda('');
    setSugerencias([]);
    setMostrarBuscador(false);

    // 2. Pre-generar identificadores reales
    const nuevoEjercicioId = generarId();
    const nuevaSerieId = generarId();
    const nuevoTramoId = generarId();

    const serieOpt: Serie = {
      id: nuevaSerieId,
      numero_serie: 1,
      tipo_serie: 'recta',
      rir: '',
      tramos: [{ id: nuevoTramoId, orden: 1, kg: '', reps: '' }],
    };

    const nuevoEjercicioOpt: Ejercicio = {
      id: nuevoEjercicioId,
      nombre: nombreLimpio,
      series: [serieOpt],
    };

    // 3. ACTUALIZACIÓN OPTIMISTA INMEDIATA (0ms de espera en la app)
    actualizarListaDia(diaActivoId, (lista) => [...lista, nuevoEjercicioOpt]);
    setAbierto(nuevoEjercicioId);

    // 4. Guardar en Supabase en segundo plano
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      let { data: existenteCatalogo } = await supabase
        .from('catalogo_ejercicio')
        .select('id')
        .ilike('nombre', nombreLimpio)
        .maybeSingle();

      let catalogoId = existenteCatalogo?.id;
      if (!catalogoId) {
        const { data: nuevo, error } = await supabase
          .from('catalogo_ejercicio')
          .insert({ nombre: nombreLimpio, es_personalizado: true, usuario_id: uid })
          .select('id')
          .single();
        if (error || !nuevo) throw error || new Error('No se pudo crear el ejercicio');
        catalogoId = nuevo.id;
      }

      const { data: filaExistente } = await supabase
        .from('ejercicio_dia')
        .select('id')
        .eq('dia_id', diaActivoId)
        .eq('catalogo_ejercicio_id', catalogoId)
        .maybeSingle();

      if (filaExistente) {
        const ejercicioDiaId = filaExistente.id;
        await supabase.from('ejercicio_dia').update({
          activo: true,
          orden: ejercicios.length + 1,
          fecha_ultimo_registro: new Date().toISOString().slice(0, 10),
        }).eq('id', ejercicioDiaId);

        const { data: seriesExistentes } = await supabase
          .from('serie_actual')
          .select('id, numero_serie, tipo_serie, rir, tramo_serie(id, orden, kg, reps)')
          .eq('ejercicio_dia_id', ejercicioDiaId)
          .order('numero_serie');

        let seriesFinales: Serie[];
        if (seriesExistentes && seriesExistentes.length > 0) {
          seriesFinales = seriesExistentes.map((s: any) => ({
            id: s.id,
            numero_serie: s.numero_serie,
            tipo_serie: (s.tipo_serie as TipoSerie) ?? 'recta',
            rir: s.rir?.toString() ?? '',
            tramos: (s.tramo_serie ?? [])
              .sort((a: any, b: any) => a.orden - b.orden)
              .map((t: any) => ({ id: t.id, orden: t.orden, kg: t.kg?.toString() ?? '', reps: t.reps?.toString() ?? '' })),
          }));
        } else {
          await supabase.from('serie_actual').insert({
            id: nuevaSerieId,
            ejercicio_dia_id: ejercicioDiaId,
            numero_serie: 1,
            tipo_serie: 'recta',
            rir: null,
          });
          await supabase.from('tramo_serie').insert({
            id: nuevoTramoId,
            serie_actual_id: nuevaSerieId,
            orden: 1,
            kg: null,
            reps: null,
          });
          seriesFinales = [serieOpt];
        }

        actualizarListaDia(diaActivoId, (lista) =>
          lista.map((e) => (e.id === nuevoEjercicioId ? { id: ejercicioDiaId, nombre: nombreLimpio, series: seriesFinales } : e))
        );
        setAbierto((cur) => (cur === nuevoEjercicioId ? ejercicioDiaId : cur));
      } else {
        await supabase.from('ejercicio_dia').insert({
          id: nuevoEjercicioId,
          dia_id: diaActivoId,
          catalogo_ejercicio_id: catalogoId,
          orden: ejercicios.length + 1,
          fecha_ultimo_registro: new Date().toISOString().slice(0, 10),
        });

        await supabase.from('serie_actual').insert({
          id: nuevaSerieId,
          ejercicio_dia_id: nuevoEjercicioId,
          numero_serie: 1,
          tipo_serie: 'recta',
          rir: null,
        });

        await supabase.from('tramo_serie').insert({
          id: nuevoTramoId,
          serie_actual_id: nuevaSerieId,
          orden: 1,
          kg: null,
          reps: null,
        });
      }
    } catch (err: any) {
      actualizarListaDia(diaActivoId, (lista) => lista.filter((e) => e.id !== nuevoEjercicioId));
      Alert.alert('Error', err?.message ?? 'No se pudo añadir el ejercicio.');
    }
  }

  async function renombrarEjercicio(ejercicioId: string, nuevoNombre: string) {
    if (!diaActivoId) return;
    const limpio = nuevoNombre.trim();
    if (!limpio) return;
    const actual = ejercicios.find((e) => e.id === ejercicioId);
    if (actual && actual.nombre.toLowerCase() === limpio.toLowerCase()) return;

    if (ejercicios.some((e) => e.id !== ejercicioId && e.nombre.toLowerCase() === limpio.toLowerCase())) {
      Alert.alert('Ya existe', 'Ya tienes un ejercicio con ese nombre en este día.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    let { data: existente } = await supabase
      .from('catalogo_ejercicio')
      .select('id')
      .ilike('nombre', limpio)
      .maybeSingle();

    let catalogoId = existente?.id;
    if (!catalogoId) {
      const { data: nuevo, error } = await supabase
        .from('catalogo_ejercicio')
        .insert({ nombre: limpio, es_personalizado: true, usuario_id: uid })
        .select('id')
        .single();
      if (error) {
        Alert.alert('No se pudo renombrar', error.message);
        return;
      }
      catalogoId = nuevo?.id;
    }

    await supabase.from('ejercicio_dia').update({ catalogo_ejercicio_id: catalogoId }).eq('id', ejercicioId);
    actualizarListaDia(diaActivoId, (lista) => lista.map((e) => (e.id === ejercicioId ? { ...e, nombre: limpio } : e)));
  }

  async function anadirSerie(ejercicioId: string) {
    if (!diaActivoId) return;
    const ejercicio = ejercicios.find((e) => e.id === ejercicioId);
    if (!ejercicio) return;
    const siguienteNumero = ejercicio.series.length + 1;
    const nuevaSerieId = generarId();
    const nuevoTramoId = generarId();

    const nuevaSerie: Serie = {
      id: nuevaSerieId,
      numero_serie: siguienteNumero,
      tipo_serie: 'recta',
      rir: '',
      tramos: [{ id: nuevoTramoId, orden: 1, kg: '', reps: '' }],
    };

    // 1. Inmediato en pantalla (0ms)
    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => (e.id === ejercicioId ? { ...e, series: [...e.series, nuevaSerie] } : e))
    );

    if (progresoAbierto === ejercicioId) {
      cargarPuntosProgreso({ ...ejercicio, series: [...ejercicio.series, nuevaSerie] }, metricaProgreso);
    }

    // 2. Persistir en segundo plano
    try {
      await supabase
        .from('serie_actual')
        .insert({ id: nuevaSerieId, ejercicio_dia_id: ejercicioId, numero_serie: siguienteNumero, tipo_serie: 'recta', rir: null });
      await supabase
        .from('tramo_serie')
        .insert({ id: nuevoTramoId, serie_actual_id: nuevaSerieId, orden: 1, kg: null, reps: null });
    } catch (err) {
      actualizarListaDia(diaActivoId, (lista) =>
        lista.map((e) => (e.id === ejercicioId ? { ...e, series: e.series.filter((s) => s.id !== nuevaSerieId) } : e))
      );
    }
  }

  async function cambiarTipoSerie(serieId: string, nuevoTipo: TipoSerie) {
    if (!diaActivoId) return;
    const ejercicioActual = ejercicios.find((e) => e.series.some((s) => s.id === serieId));
    const serieActual = ejercicioActual?.series.find((s) => s.id === serieId);

    if (nuevoTipo === 'recta' && serieActual && serieActual.tramos.length > 1) {
      const idsSobrantes = serieActual.tramos.slice(1).map((t) => t.id);
      await supabase.from('tramo_serie').delete().in('id', idsSobrantes);
    }

    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => ({
        ...e,
        series: e.series.map((s) =>
          s.id === serieId
            ? { ...s, tipo_serie: nuevoTipo, tramos: nuevoTipo === 'recta' ? s.tramos.slice(0, 1) : s.tramos }
            : s
        ),
      }))
    );
    await supabase.from('serie_actual').update({ tipo_serie: nuevoTipo }).eq('id', serieId);
  }
  async function actualizarTramo(serieId: string, tramoId: string, campo: 'kg' | 'reps', valor: string) {
    if (!diaActivoId) return;
    let ejercicioAfectadoId: string | null = null;
    let seriesActualizadas: Serie[] = [];

    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => {
        if (!e.series.some((s) => s.id === serieId)) return e;
        ejercicioAfectadoId = e.id;
        seriesActualizadas = e.series.map((s) =>
          s.id === serieId
            ? { ...s, tramos: s.tramos.map((t) => (t.id === tramoId ? { ...t, [campo]: valor } : t)) }
            : s
        );
        return { ...e, series: seriesActualizadas };
      })
    );

    const vLimpio = valor.trim().replace(',', '.');
    const vNum = vLimpio === '' ? null : isNaN(Number(vLimpio)) ? null : Number(vLimpio);
    await supabase.from('tramo_serie').update({ [campo]: vNum }).eq('id', tramoId);

    if (ejercicioAfectadoId && progresoAbierto === ejercicioAfectadoId) {
      const ejercicio = ejercicios.find((e) => e.id === ejercicioAfectadoId);
      if (ejercicio) cargarPuntosProgreso({ ...ejercicio, series: seriesActualizadas }, metricaProgreso);
    }
  }

  async function actualizarRir(serieId: string, valor: string) {
    if (!diaActivoId) return;
    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => ({ ...e, series: e.series.map((s) => (s.id === serieId ? { ...s, rir: valor } : s)) }))
    );
    const rLimpio = valor.trim().replace(',', '.');
    const rNum = rLimpio === '' ? null : isNaN(Number(rLimpio)) ? null : Number(rLimpio);
    await supabase.from('serie_actual').update({ rir: rNum }).eq('id', serieId);
  }

  async function anadirTramo(serieId: string) {
    if (!diaActivoId) return;
    const ejercicio = ejercicios.find((e) => e.series.some((s) => s.id === serieId));
    const serie = ejercicio?.series.find((s) => s.id === serieId);
    if (!serie) return;
    const siguienteOrden = serie.tramos.length + 1;
    const nuevoTramoId = generarId();

    const nuevoTramo: Tramo = { id: nuevoTramoId, orden: siguienteOrden, kg: '', reps: '' };

    // 1. Inmediato en pantalla (0ms)
    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => ({ ...e, series: e.series.map((s) => (s.id === serieId ? { ...s, tramos: [...s.tramos, nuevoTramo] } : s)) }))
    );

    // 2. Persistir en segundo plano
    try {
      await supabase
        .from('tramo_serie')
        .insert({ id: nuevoTramoId, serie_actual_id: serieId, orden: siguienteOrden, kg: null, reps: null });
    } catch (err) {
      actualizarListaDia(diaActivoId, (lista) =>
        lista.map((e) => ({ ...e, series: e.series.map((s) => (s.id === serieId ? { ...s, tramos: s.tramos.filter((t) => t.id !== nuevoTramoId) } : s)) }))
      );
    }
  }

  async function borrarTramo(serieId: string, tramoId: string) {
    if (!diaActivoId) return;
    const ejercicio = ejercicios.find((e) => e.series.some((s) => s.id === serieId));
    const serie = ejercicio?.series.find((s) => s.id === serieId);
    if (!serie || serie.tramos.length <= 1) return;

    await supabase.from('tramo_serie').delete().eq('id', tramoId);

    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => ({ ...e, series: e.series.map((s) => (s.id === serieId ? { ...s, tramos: s.tramos.filter((t) => t.id !== tramoId) } : s)) }))
    );
  }

  async function borrarSerie(serieId: string) {
    if (!diaActivoId) return;
    await supabase.from('serie_actual').delete().eq('id', serieId);
    let ejercicioAfectadoId: string | null = null;
    let seriesRestantes: Serie[] = [];

    actualizarListaDia(diaActivoId, (lista) =>
      lista.map((e) => {
        if (!e.series.some((s) => s.id === serieId)) return e;
        ejercicioAfectadoId = e.id;
        seriesRestantes = e.series.filter((s) => s.id !== serieId);
        return { ...e, series: seriesRestantes };
      })
    );

    if (ejercicioAfectadoId && progresoAbierto === ejercicioAfectadoId) {
      const ejercicio = ejercicios.find((e) => e.id === ejercicioAfectadoId);
      if (ejercicio) cargarPuntosProgreso({ ...ejercicio, series: seriesRestantes }, metricaProgreso);
    }
  }

  function calcularValor(tramos: { kg: number; reps: number }[], metric: '1rm' | 'volumen') {
    if (metric === 'volumen') {
      return Math.round(tramos.reduce((acc, t) => acc + t.kg * t.reps, 0));
    }
    let best = 0;
    tramos.forEach((t) => {
      if (t.kg > 0 && t.reps > 0) {
        const est = t.kg * (1 + t.reps / 30);
        if (est > best) best = est;
      }
    });
    return Math.round(best);
  }

  async function cargarPuntosProgreso(ejercicio: Ejercicio, metric: '1rm' | 'volumen') {
    const { data } = await supabase
      .from('serie_historial')
      .select('fecha, numero_serie, tramo_historial(kg, reps)')
      .eq('ejercicio_dia_id', ejercicio.id)
      .order('fecha');

    const porFecha: Record<string, { tramos: { kg: number; reps: number }[]; seriesCount: number }> = {};
    (data ?? []).forEach((row: any) => {
      if (!porFecha[row.fecha]) porFecha[row.fecha] = { tramos: [], seriesCount: 0 };
      porFecha[row.fecha].seriesCount += 1;
      (row.tramo_historial ?? []).forEach((t: any) => {
        porFecha[row.fecha].tramos.push({ kg: t.kg ?? 0, reps: t.reps ?? 0 });
      });
    });

    const puntos: PuntoProgreso[] = Object.entries(porFecha).map(([fecha, info]) => ({
      fecha,
      valor: calcularValor(info.tramos, metric),
      seriesCount: info.seriesCount,
    }));

    const tramosHoy = ejercicio.series.flatMap((s) =>
      s.tramos.map((t) => ({
        kg: Number(t.kg.replace(',', '.')) || 0,
        reps: Number(t.reps.replace(',', '.')) || 0,
      }))
    );
    const valorHoy = calcularValor(tramosHoy, metric);
    if (valorHoy > 0) puntos.push({ fecha: 'Hoy', valor: valorHoy, seriesCount: ejercicio.series.length });

    setDatosProgreso(puntos);
  }

  function toggleProgreso(ejercicio: Ejercicio) {
    if (progresoAbierto === ejercicio.id) {
      setProgresoAbierto(null);
      return;
    }
    setProgresoAbierto(ejercicio.id);
    const esRelevante = EJERCICIOS_1RM.has(ejercicio.nombre.toLowerCase());
    cargarPuntosProgreso(ejercicio, esRelevante ? metricaProgreso : 'volumen');
  }

  function cambiarMetrica(ejercicio: Ejercicio, metric: '1rm' | 'volumen') {
    setMetricaProgreso(metric);
    cargarPuntosProgreso(ejercicio, metric);
  }

  async function borrarEjercicio(ejercicioId: string) {
    if (!diaActivoId) return;
    await supabase.from('ejercicio_dia').update({ activo: false }).eq('id', ejercicioId);
    actualizarListaDia(diaActivoId, (lista) => lista.filter((e) => e.id !== ejercicioId));
    if (progresoAbierto === ejercicioId) setProgresoAbierto(null);
  }

  async function renombrarTitulo(nuevoTitulo: string) {
    setTitulo(nuevoTitulo);
    await supabase.from('rutina').update({ titulo: nuevoTitulo }).eq('id', id);
  }

  async function volverAtras() {
    if (!titulo.trim()) {
      const { data: diasRow } = await supabase.from('dia').select('id').eq('rutina_id', id);
      const diaIds = (diasRow ?? []).map((d: any) => d.id);
      let totalEjercicios = 0;
      if (diaIds.length) {
        const { count } = await supabase
          .from('ejercicio_dia')
          .select('id', { count: 'exact', head: true })
          .in('dia_id', diaIds)
          .eq('activo', true);
        totalEjercicios = count ?? 0;
      }
      if (totalEjercicios === 0) {
        await supabase.from('rutina').delete().eq('id', id);
      }
    }
    router.replace('/');
  }

  function renderProgresoBlock(e: Ejercicio) {
    const baseline = datosProgreso[0]?.seriesCount ?? 0;
    return (
      <View style={styles.progresoCard}>
        {EJERCICIOS_1RM.has(e.nombre.toLowerCase()) && (
          <View style={styles.metricaRow}>
            <TouchableOpacity
              style={[styles.metricaChip, metricaProgreso === '1rm' && { backgroundColor: accent, borderColor: accent }]}
              onPress={() => cambiarMetrica(e, '1rm')}
            >
              <Text style={[styles.metricaText, metricaProgreso === '1rm' && styles.metricaTextActiva]}>1RM estimado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricaChip, metricaProgreso === 'volumen' && { backgroundColor: accent, borderColor: accent }]}
              onPress={() => cambiarMetrica(e, 'volumen')}
            >
              <Text style={[styles.metricaText, metricaProgreso === 'volumen' && styles.metricaTextActiva]}>Volumen total</Text>
            </TouchableOpacity>
          </View>
        )}

        {EJERCICIOS_1RM.has(e.nombre.toLowerCase()) && metricaProgreso === '1rm' && (
          <Text style={styles.infoBox}>
            Estimación del peso máximo a 1 repetición, según tu mejor serie. No sustituye una prueba real.
          </Text>
        )}

        {datosProgreso.length === 0 ? (
          <Text style={styles.sinDatos}>Aún no hay datos suficientes.</Text>
        ) : (
          <>
            {(() => {
              const W = 280, H = 130, padL = 8, padR = 8, padT = 18, padB = 22;
              const vals = datosProgreso.map((d) => d.valor);
              const minV = Math.min(...vals), maxV = Math.max(...vals);
              const rangeV = (maxV - minV) || 1;
              const yFor = (v: number) => padT + (H - padT - padB) * (1 - (v - minV) / rangeV);
              const xFor = (i: number) => (datosProgreso.length === 1 ? W / 2 : padL + (W - padL - padR) * (i / (datosProgreso.length - 1)));
              const pts = datosProgreso.map((d, i) => ({ x: xFor(i), y: yFor(d.valor), ...d }));
              const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
              return (
                <Svg width="100%" height={130} viewBox={`0 0 ${W} ${H}`}>
                  <SvgLine x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(255,255,255,0.1)" />
                  {pts.length > 1 && <Path d={pathD} stroke={accent} strokeWidth={2} fill="none" />}
                  {pts.map((p, i) => {
                    const color = p.seriesCount > baseline ? '#4C8C5B' : p.seriesCount < baseline ? '#D9B23C' : accent;
                    return (
                      <React.Fragment key={i}>
                        <Circle cx={p.x} cy={p.y} r={p.fecha === 'Hoy' ? 4 : 3} fill={color} />
                        <SvgText x={p.x} y={p.y - 8} fontSize="9" fill="#ECE8DE" textAnchor="middle">{p.valor}</SvgText>
                        <SvgText x={p.x} y={H - 6} fontSize="8" fill="#8B8D97" textAnchor="middle">{p.fecha === 'Hoy' ? 'Hoy' : p.fecha.slice(5)}</SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              );
            })()}
            {datosProgreso.length > 1 && (
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>🟢 Más series que al inicio</Text>
                <Text style={styles.legendItem}>🟡 Menos series que al inicio</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  function explicarTiposSerie() {
    Alert.alert(
      '¿Qué diferencia hay?',
      'Recta: una serie normal, un peso y unas reps.\n\nMulti-tramo: para cuando una misma serie tiene varios bloques de peso/reps sin apenas descanso entre ellos — drop set (bajas el peso y sigues), cluster set (mismo peso, mini-descansos de segundos), rest-pause y myo-reps (descansas unos segundos y sacas más reps). Añade un tramo por cada bloque con "+ tramo".'
    );
  }

  function renderTipoSelector(s: Serie, enHoja: boolean = false) {
    if (!mostrarTipoSerie) return null;
    const label = TIPOS_SERIE.find((t) => t.value === s.tipo_serie)?.label ?? 'Recta';
    if (tipoSelectorAbierto !== s.id) {
      return (
        <View style={styles.tipoSelectorRow}>
          <TouchableOpacity onPress={() => setTipoSelectorAbierto(s.id)} style={styles.tipoLabelBtn}>
            <Text style={[styles.tipoLabelText, enHoja && { color: hojaMuted }]}>{label} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={explicarTiposSerie} style={{ marginLeft: 6 }}>
            <Text style={[styles.tipoInfoIcon, enHoja && { color: hojaMuted }]}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.tipoChipsRow}>
        {TIPOS_SERIE.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tipoChip, s.tipo_serie === t.value && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => { cambiarTipoSerie(s.id, t.value); setTipoSelectorAbierto(null); }}
          >
            <Text style={[styles.tipoChipText, s.tipo_serie === t.value && styles.tipoChipTextActiva]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderAddExercise(inSheet: boolean) {
    if (!mostrarBuscador) {
      return (
        <TouchableOpacity onPress={() => setMostrarBuscador(true)} style={inSheet ? { marginTop: 8 } : { marginTop: 4 }}>
          <Text style={[styles.addExerciseButton, { color: accent }]}>+ Añadir ejercicio</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={inSheet ? { marginTop: 8 } : undefined}>
        <Text style={[styles.label, inSheet && { color: hojaMuted }]}>Añadir ejercicio</Text>
        <TextInput
          style={[styles.input, inSheet && { backgroundColor: hojaBlankBg, color: hojaText, borderColor: hojaBorder }]}
          placeholder="Ej. Press banca"
          placeholderTextColor={inSheet ? hojaMuted : '#8B8D97'}
          value={busqueda}
          onChangeText={buscarEjercicios}
          onSubmitEditing={() => anadirEjercicio(busqueda)}
        />
        {sugerencias.map((s) => (
          <TouchableOpacity key={s} onPress={() => anadirEjercicio(s)}>
            <Text style={[styles.sugerencia, inSheet && { color: hojaMuted }]}>{s}</Text>
          </TouchableOpacity>
        ))}
        {busqueda.trim().length > 0 && !sugerencias.includes(busqueda) && (
          <TouchableOpacity onPress={() => anadirEjercicio(busqueda)}>
            <Text style={[styles.sugerencia, { color: accent }]}>+ Crear "{busqueda}"</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={volverAtras}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>

        {/* Portada de la Rutina */}
        <View style={styles.portadaContainer}>
          <View style={styles.portadaTopRow}>
            <View style={styles.portadaTagWrap}>
              <View style={[styles.portadaDot, { backgroundColor: accent }]} />
              <Text style={[styles.portadaTag, { color: accent }]}>RUTINA</Text>
            </View>
            <TouchableOpacity
              style={[styles.editorBtn, { borderColor: border, backgroundColor: surface }]}
              onPress={() => router.push(`/rutina/${id}/editor`)}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={15} color="#ECE8DE" />
              <Text style={styles.editorBtnText}>Ajustes</Text>
            </TouchableOpacity>
          </View>

          {editandoTitulo ? (
            <TextInput
              style={styles.titleInput}
              value={tituloTemp}
              onChangeText={setTituloTemp}
              autoFocus
              onBlur={() => { setEditandoTitulo(false); renombrarTitulo(tituloTemp); }}
              onSubmitEditing={() => { setEditandoTitulo(false); renombrarTitulo(tituloTemp); }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => { setTituloTemp(titulo); setEditandoTitulo(true); }}
              activeOpacity={0.85}
              style={styles.titleTouch}
            >
              <Text style={styles.title} numberOfLines={2}>
                {titulo.trim() || 'Rutina sin título'}
              </Text>
              <Ionicons name="pencil-sharp" size={15} color="#8B8D97" style={{ marginTop: 6, marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.diasRow}>
          <DraggableFlatList
            horizontal
            data={dias}
            keyExtractor={(item) => item.id}
            onDragEnd={onDragEndDias}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: d, drag, isActive }: RenderItemParams<Dia>) => (
              <ScaleDecorator>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onLongPress={drag}
                  disabled={isActive}
                  onPress={() => {
                    if (diaActivoId === d.id) {
                      setNombreDiaTemp(d.nombre);
                      setEditandoDiaId(d.id);
                    } else {
                      seleccionarDia(d.id);
                    }
                  }}
                  style={[
                    styles.chip,
                    diaActivoId === d.id && { backgroundColor: accent, borderColor: accent },
                    isActive && { opacity: 0.9, transform: [{ scale: 1.08 }] },
                  ]}
                >
                  {editandoDiaId === d.id ? (
                    <TextInput
                      style={styles.chipInput}
                      value={nombreDiaTemp}
                      onChangeText={setNombreDiaTemp}
                      autoFocus
                      onBlur={() => { setEditandoDiaId(null); renombrarDia(d.id, nombreDiaTemp); }}
                      onSubmitEditing={() => { setEditandoDiaId(null); renombrarDia(d.id, nombreDiaTemp); }}
                    />
                  ) : (
                    <Text style={[styles.chipText, diaActivoId === d.id && styles.chipTextActiva]}>{d.nombre}</Text>
                  )}
                  <TouchableOpacity onPress={() => confirmarBorrarDia(d.id, d.nombre)} style={{ marginLeft: 6 }}>
                    <Text style={[styles.chipDelete, diaActivoId === d.id && { color: '#fff' }]}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </ScaleDecorator>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.chip, styles.chipAdd, { borderColor: accent }]}
                onPress={anadirDia}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipAddText, { color: accent }]}>+</Text>
              </TouchableOpacity>
            }
          />
        </View>

        {estiloRegistro === 'acordeon' && !diaCargado && (
          <Text style={styles.sinDatos}>Cargando...</Text>
        )}

        {estiloRegistro === 'acordeon' && ejercicios.map((e) => (
          <View key={e.id} style={styles.ejercicioBox}>
            <View style={styles.ejercicioHeader}>
              {editandoEjercicioId === e.id ? (
                <TextInput
                  style={styles.ejercicioInput}
                  value={nombreEjercicioTemp}
                  onChangeText={setNombreEjercicioTemp}
                  autoFocus
                  onBlur={() => { setEditandoEjercicioId(null); renombrarEjercicio(e.id, nombreEjercicioTemp); }}
                  onSubmitEditing={() => { setEditandoEjercicioId(null); renombrarEjercicio(e.id, nombreEjercicioTemp); }}
                />
              ) : (
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setAbierto(abierto === e.id ? null : e.id)}
                  onLongPress={() => { setNombreEjercicioTemp(e.nombre); setEditandoEjercicioId(e.id); }}
                >
                  <Text style={[styles.ejercicioNombre, { fontSize: 14 * escala }]}>{e.nombre}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => borrarEjercicio(e.id)}>
                <Text style={styles.trash}>✕</Text>
              </TouchableOpacity>
            </View>

            {abierto === e.id && (
              <View style={styles.ejercicioBody}>
                {!mostrarTipoSerie ? (
                  <>
                    {e.series.length > 0 && (
                      <View style={styles.colLabels}>
                        <Text style={[styles.colLabelText, { width: 16, flex: 0 }]}>#</Text>
                        <Text style={styles.colLabelText}>Kg</Text>
                        <Text style={styles.colLabelText}>Reps</Text>
                        {mostrarRir && <Text style={[styles.colLabelText, { width: 58, flex: 0 }]}>RIR</Text>}
                        <Text style={[styles.colLabelText, { width: 18, flex: 0 }]}> </Text>
                      </View>
                    )}

                    {e.series.map((s, i) =>
                      s.tramos.map((t, ti) => (
                        <View key={t.id} style={styles.serieRow}>
                          <Text style={styles.serieNum}>
                            {s.tramos.length > 1 ? `${i + 1}.${ti + 1}` : i + 1}
                          </Text>
                          <TextInput
                            style={[styles.serieInput, { paddingVertical: 8 * escala }]}
                            placeholder="kg"
                            placeholderTextColor="#8B8D97"
                            keyboardType="numeric"
                            value={t.kg}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'kg', v)}
                          />
                          <TextInput
                            style={[styles.serieInput, { paddingVertical: 8 * escala }]}
                            placeholder="reps"
                            placeholderTextColor="#8B8D97"
                            keyboardType="numeric"
                            value={t.reps}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'reps', v)}
                          />
                          {mostrarRir && ti === 0 ? (
                            <TextInput
                              style={[styles.serieInputRir, { paddingVertical: 8 * escala }]}
                              placeholder="FALLO"
                              placeholderTextColor="#8B8D97"
                              keyboardType="numeric"
                              value={s.rir}
                              onChangeText={(v) => actualizarRir(s.id, v)}
                            />
                          ) : mostrarRir ? (
                            <View style={{ width: 58 }} />
                          ) : null}
                          {ti === s.tramos.length - 1 ? (
                            <TouchableOpacity onPress={() => borrarSerie(s.id)} style={{ width: 18, alignItems: 'center' }}>
                              <Text style={styles.trash}>✕</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: 18 }} />
                          )}
                        </View>
                      ))
                    )}
                  </>
                ) : (
                  e.series.map((s, i) => (
                    <View key={s.id} style={styles.serieBlock}>
                      <View style={styles.serieBlockHeader}>
                        <Text style={styles.serieBlockTitle}>Serie {i + 1}</Text>
                        <TouchableOpacity onPress={() => borrarSerie(s.id)}>
                          <Text style={styles.trash}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      {renderTipoSelector(s)}

                      <View style={styles.colLabels}>
                        {s.tipo_serie !== 'recta' ? (
                          <>
                            <Text style={[styles.colLabelText, { width: 16, flex: 0 }]}>#</Text>
                            <Text style={styles.colLabelText}>Kg</Text>
                            <Text style={styles.colLabelText}>Reps</Text>
                            <Text style={[styles.colLabelText, { width: 18, flex: 0 }]}> </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.colLabelText}>Kg</Text>
                            <Text style={styles.colLabelText}>Reps</Text>
                            {mostrarRir && <Text style={[styles.colLabelText, { width: 58, flex: 0 }]}>RIR</Text>}
                            <Text style={[styles.colLabelText, { width: 18, flex: 0 }]}> </Text>
                          </>
                        )}
                      </View>

                      {s.tramos.map((t, ti) => (
                        <View key={t.id} style={styles.serieRow}>
                          {s.tipo_serie !== 'recta' && <Text style={styles.serieNum}>{ti + 1}</Text>}
                          <TextInput
                            style={[styles.serieInput, { paddingVertical: 8 * escala }]}
                            placeholder="kg"
                            placeholderTextColor="#8B8D97"
                            keyboardType="numeric"
                            value={t.kg}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'kg', v)}
                          />
                          <TextInput
                            style={[styles.serieInput, { paddingVertical: 8 * escala }]}
                            placeholder="reps"
                            placeholderTextColor="#8B8D97"
                            keyboardType="numeric"
                            value={t.reps}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'reps', v)}
                          />
                          {s.tipo_serie === 'recta' && mostrarRir && (
                            <TextInput
                              style={[styles.serieInputRir, { paddingVertical: 8 * escala }]}
                              placeholder="FALLO"
                              placeholderTextColor="#8B8D97"
                              keyboardType="numeric"
                              value={s.rir}
                              onChangeText={(v) => actualizarRir(s.id, v)}
                            />
                          )}
                          {s.tipo_serie !== 'recta' && s.tramos.length > 1 ? (
                            <TouchableOpacity onPress={() => borrarTramo(s.id, t.id)} style={{ width: 18, alignItems: 'center' }}>
                              <Text style={styles.trash}>×</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: 18 }} />
                          )}
                        </View>
                      ))}

                      {s.tipo_serie !== 'recta' && (
                        <View style={styles.multiTramoActions}>
                          <TouchableOpacity onPress={() => anadirTramo(s.id)}>
                            <Text style={[styles.addSerieText, { color: accent, fontSize: 11 }]}>+ Añadir tramo</Text>
                          </TouchableOpacity>
                          {mostrarRir && (
                            <View style={styles.multiTramoRirBox}>
                              <Text style={styles.multiTramoRirLabel}>RIR serie:</Text>
                              <TextInput
                                style={[styles.serieInputRir, { paddingVertical: 6 * escala }]}
                                placeholder="FALLO"
                                placeholderTextColor="#8B8D97"
                                keyboardType="numeric"
                                value={s.rir}
                                onChangeText={(v) => actualizarRir(s.id, v)}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))
                )}

                <TouchableOpacity style={styles.addSerieBtn} onPress={() => anadirSerie(e.id)}>
                  <Text style={[styles.addSerieText, { color: accent }]}>+ Añadir serie</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.progresoBtn,
                    { borderColor: accent },
                    progresoAbierto === e.id && { backgroundColor: `${accent}18` },
                  ]}
                  onPress={() => toggleProgreso(e)}
                >
                  <Text style={[styles.progresoBtnText, { color: accent }]}>
                    {progresoAbierto === e.id ? 'Ocultar progreso' : 'Ver progreso'}
                  </Text>
                </TouchableOpacity>

                {progresoAbierto === e.id && renderProgresoBlock(e)}
              </View>
            )}
          </View>
        ))}

        {estiloRegistro === 'notas' && (
          <View style={[styles.notebookSheet, { backgroundColor: hojaBg, borderColor: hojaBorder }]}>
            {ejercicios.map((e) => (
              <View key={e.id} style={[styles.noteExercise, { borderColor: hojaBorder }]}>
                <View style={styles.noteExerciseHeader}>
                  {editandoEjercicioId === e.id ? (
                    <TextInput
                      style={[styles.ejercicioInput, { color: hojaText, backgroundColor: hojaBlankBg }]}
                      value={nombreEjercicioTemp}
                      onChangeText={setNombreEjercicioTemp}
                      autoFocus
                      onBlur={() => { setEditandoEjercicioId(null); renombrarEjercicio(e.id, nombreEjercicioTemp); }}
                      onSubmitEditing={() => { setEditandoEjercicioId(null); renombrarEjercicio(e.id, nombreEjercicioTemp); }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onLongPress={() => { setNombreEjercicioTemp(e.nombre); setEditandoEjercicioId(e.id); }}
                    >
                      <Text style={[styles.ejercicioNombre, { color: hojaText, fontSize: 14 * escala }]}>{e.nombre}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => borrarEjercicio(e.id)}>
                    <Text style={[styles.trash, { color: hojaMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {e.series.map((s) => (
                  <View key={s.id} style={styles.noteSerieGroup}>
                    {renderTipoSelector(s, true)}
                    {s.tipo_serie === 'recta' ? (
                      s.tramos.map((t) => (
                        <View key={t.id} style={styles.noteSerieLine}>
                          <TextInput
                            style={[styles.noteBlank, { backgroundColor: hojaBlankBg, color: hojaText, width: 48 * escala, fontSize: 13 * escala }]}
                            placeholder="__"
                            placeholderTextColor={hojaMuted}
                            keyboardType="numeric"
                            value={t.kg}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'kg', v)}
                          />
                          <Text style={[styles.noteText, { color: hojaText, fontSize: 12 * escala }]}>KG a unas</Text>
                          <TextInput
                            style={[styles.noteBlank, { backgroundColor: hojaBlankBg, color: hojaText, width: 48 * escala, fontSize: 13 * escala }]}
                            placeholder="__"
                            placeholderTextColor={hojaMuted}
                            keyboardType="numeric"
                            value={t.reps}
                            onChangeText={(v) => actualizarTramo(s.id, t.id, 'reps', v)}
                          />
                          <Text style={[styles.noteText, { color: hojaText, fontSize: 12 * escala }]}>
                            {mostrarRir ? 'reps, RIR' : 'repeticiones'}
                          </Text>
                          {mostrarRir && (
                            <TextInput
                              style={[styles.noteBlankSmall, { backgroundColor: hojaBlankBg, color: hojaText, width: 58 * escala, fontSize: 11 * escala }]}
                              placeholder="FALLO"
                              placeholderTextColor={hojaMuted}
                              keyboardType="numeric"
                              value={s.rir}
                              onChangeText={(v) => actualizarRir(s.id, v)}
                            />
                          )}
                          <TouchableOpacity onPress={() => borrarSerie(s.id)}>
                            <Text style={[styles.trash, { color: hojaMuted }]}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <>
                        {s.tramos.map((t, ti) => (
                          <View key={t.id} style={styles.noteSerieLine}>
                            {ti > 0 && <Text style={[styles.noteText, { color: hojaMuted, fontSize: 12 * escala }]}>→</Text>}
                            <TextInput
                              style={[styles.noteBlank, { backgroundColor: hojaBlankBg, color: hojaText, width: 48 * escala, fontSize: 13 * escala }]}
                              placeholder="__"
                              placeholderTextColor={hojaMuted}
                              keyboardType="numeric"
                              value={t.kg}
                              onChangeText={(v) => actualizarTramo(s.id, t.id, 'kg', v)}
                            />
                            <Text style={[styles.noteText, { color: hojaText, fontSize: 12 * escala }]}>KG a unas</Text>
                            <TextInput
                              style={[styles.noteBlank, { backgroundColor: hojaBlankBg, color: hojaText, width: 48 * escala, fontSize: 13 * escala }]}
                              placeholder="__"
                              placeholderTextColor={hojaMuted}
                              keyboardType="numeric"
                              value={t.reps}
                              onChangeText={(v) => actualizarTramo(s.id, t.id, 'reps', v)}
                            />
                            <Text style={[styles.noteText, { color: hojaText, fontSize: 12 * escala }]}>repeticiones</Text>
                            {s.tramos.length > 1 && (
                              <TouchableOpacity onPress={() => borrarTramo(s.id, t.id)}>
                                <Text style={[styles.trash, { color: hojaMuted }]}>×</Text>
                              </TouchableOpacity>
                            )}
                            {ti === s.tramos.length - 1 && (
                              <TouchableOpacity onPress={() => borrarSerie(s.id)}>
                                <Text style={[styles.trash, { color: hojaMuted }]}>✕</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        <View style={styles.noteMultiTramoFooter}>
                          <TouchableOpacity onPress={() => anadirTramo(s.id)}>
                            <Text style={[styles.addSerieText, { color: accent, fontSize: 11 }]}>+ tramo</Text>
                          </TouchableOpacity>
                          {mostrarRir && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.noteText, { color: hojaMuted, fontSize: 11 * escala }]}>RIR serie:</Text>
                              <TextInput
                                style={[styles.noteBlankSmall, { backgroundColor: hojaBlankBg, color: hojaText, width: 58 * escala, fontSize: 11 * escala }]}
                                placeholder="FALLO"
                                placeholderTextColor={hojaMuted}
                                keyboardType="numeric"
                                value={s.rir}
                                onChangeText={(v) => actualizarRir(s.id, v)}
                              />
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                ))}

                <TouchableOpacity onPress={() => anadirSerie(e.id)}>
                  <Text style={[styles.addSerieText, { color: accent }]}>+ Añadir serie</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.progresoBtn,
                    { borderColor: accent, backgroundColor: hojaBlankBg },
                    progresoAbierto === e.id && { backgroundColor: `${accent}18` },
                  ]}
                  onPress={() => toggleProgreso(e)}
                >
                  <Text style={[styles.progresoBtnText, { color: accent }]}>
                    {progresoAbierto === e.id ? 'Ocultar progreso' : 'Ver progreso'}
                  </Text>
                </TouchableOpacity>

                {progresoAbierto === e.id && renderProgresoBlock(e)}
              </View>
            ))}

            {renderAddExercise(true)}
          </View>
        )}

        {estiloRegistro === 'acordeon' && renderAddExercise(false)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17181B' },
  back: { color: '#8B8D97', fontSize: 14, marginBottom: 20 },
  portadaContainer: { marginBottom: 20, marginTop: 4 },
  portadaTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  portadaTagWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  portadaDot: { width: 6, height: 6, borderRadius: 3 },
  portadaTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  editorBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  editorBtnText: { color: '#ECE8DE', fontSize: 11, fontWeight: '600' },
  titleTouch: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  title: { color: '#ECE8DE', fontSize: 28, fontWeight: '900', letterSpacing: -0.6, lineHeight: 34, flexShrink: 1 },
  titleInput: { color: '#ECE8DE', fontSize: 28, fontWeight: '900', letterSpacing: -0.6, borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.3)', paddingVertical: 2, marginBottom: 4 },
  diasRow: { marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginRight: 8 },
  chipDelete: { color: '#8B8D97', fontSize: 13 },
  chipText: { color: '#8B8D97', fontSize: 12 },
  chipTextActiva: { color: '#fff', fontWeight: '600' },
  chipInput: { color: '#ECE8DE', fontSize: 12, padding: 0, minWidth: 50 },
  chipAdd: { borderStyle: 'dashed' },
  chipAddText: { fontSize: 12 },
  ejercicioBox: { backgroundColor: '#2A2B31', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  ejercicioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  ejercicioNombre: { color: '#ECE8DE', fontWeight: '600' },
  ejercicioInput: { flex: 1, color: '#ECE8DE', fontSize: 14, fontWeight: '600', padding: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' },
  trash: { color: '#8B8D97', fontSize: 15 },
  ejercicioBody: { padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  serieBlock: { marginBottom: 14 },
  serieBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  serieBlockTitle: { color: '#8B8D97', fontSize: 11, fontWeight: '700' },
  tipoChipsRow: { marginBottom: 6 },
  tipoChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginRight: 6 },
  tipoChipText: { color: '#8B8D97', fontSize: 10 },
  tipoChipTextActiva: { color: '#fff', fontWeight: '600' },
  tipoSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tipoLabelBtn: { alignSelf: 'flex-start' },
  tipoLabelText: { color: '#8B8D97', fontSize: 11, fontWeight: '600' },
  tipoInfoIcon: { color: '#8B8D97', fontSize: 13 },
  colLabels: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  colLabelText: { flex: 1, color: '#8B8D97', fontSize: 9, textAlign: 'center' },
  serieRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  serieNum: { color: '#8B8D97', fontSize: 12, width: 16 },
  serieInput: { flex: 1, backgroundColor: '#17181B', borderRadius: 8, padding: 8, color: '#ECE8DE', textAlign: 'center' },
  serieInputRir: { width: 58, minHeight: 34, backgroundColor: '#17181B', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 8, color: '#ECE8DE', textAlign: 'center' },
  multiTramoActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 4 },
  multiTramoRirBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  multiTramoRirLabel: { color: '#8B8D97', fontSize: 11, fontWeight: '600' },
  addSerieBtn: { marginTop: 4 },
  addSerieText: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
  addExerciseButton: { fontSize: 13, fontWeight: '700' },
  progresoBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 0, borderWidth: 1, borderColor: '#FF3B53', backgroundColor: '#1E1F24', marginTop: 10, marginBottom: 6 },
  progresoBtnText: { color: '#8B8D97', fontSize: 11, fontWeight: '600' },
  progresoCard: { backgroundColor: '#17181B', borderRadius: 10, padding: 10, marginTop: 4 },
  metricaRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  metricaChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  metricaText: { color: '#8B8D97', fontSize: 11 },
  metricaTextActiva: { color: '#fff', fontWeight: '600' },
  infoBox: { backgroundColor: 'rgba(59,110,168,0.12)', borderColor: 'rgba(59,110,168,0.3)', borderWidth: 1, color: '#3B6EA8', fontSize: 11, padding: 8, borderRadius: 8, marginBottom: 8, lineHeight: 16 },
  sinDatos: { color: '#8B8D97', fontSize: 12 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  legendItem: { color: '#8B8D97', fontSize: 9 },
  label: { color: '#8B8D97', fontSize: 12, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#2A2B31', borderRadius: 10, padding: 12, color: '#ECE8DE', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sugerencia: { color: '#8B8D97', padding: 10, fontSize: 13 },
  notebookSheet: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1 },
  noteExercise: { paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  noteExerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  noteSerieGroup: { marginBottom: 10 },
  noteSerieLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  noteMultiTramoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 6 },
  noteBlank: { borderRadius: 8, padding: 6, textAlign: 'center' },
  noteBlankSmall: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, minHeight: 28, textAlign: 'center' },
  noteText: {},
});