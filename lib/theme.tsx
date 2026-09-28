import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

export type TemaId =
  | 'rojo'
  | 'azul'
  | 'amarillo'
  | 'verde'
  | 'cyberpunk'
  | 'oceano'
  | 'vaporwave'
  | 'venom'
  | 'magma'
  | 'titanio';

export type TemaConfig = {
  id: TemaId;
  nombre: string;
  tag: string;
  accent: string;
  accentSecondary: string;
  gradient: [string, string];
  bg: string;
  surface: string;
  surfaceHighlight: string;
  border: string;
  glow: string;
};

export const TEMAS_CONFIG: Record<TemaId, TemaConfig> = {
  rojo: {
    id: 'rojo',
    nombre: 'Crimson Sunset',
    tag: 'Carmesí & Fuego',
    accent: '#FF3B53',
    accentSecondary: '#FF7A00',
    gradient: ['#FF334B', '#FF7A00'],
    bg: '#161113',
    surface: '#24191C',
    surfaceHighlight: '#322025',
    border: 'rgba(255, 59, 83, 0.22)',
    glow: 'rgba(255, 59, 83, 0.35)',
  },
  azul: {
    id: 'azul',
    nombre: 'Midnight Blurple',
    tag: 'Blurple & Cyan',
    accent: '#5865F2',
    accentSecondary: '#00D2FF',
    gradient: ['#5865F2', '#00D2FF'],
    bg: '#10131F',
    surface: '#191D2E',
    surfaceHighlight: '#22283E',
    border: 'rgba(88, 101, 242, 0.24)',
    glow: 'rgba(88, 101, 242, 0.35)',
  },
  amarillo: {
    id: 'amarillo',
    nombre: 'Solar Flare',
    tag: 'Ámbar & Oro',
    accent: '#FFB800',
    accentSecondary: '#FF5E00',
    gradient: ['#FFB800', '#FF5E00'],
    bg: '#17140E',
    surface: '#262014',
    surfaceHighlight: '#352C1C',
    border: 'rgba(255, 184, 0, 0.22)',
    glow: 'rgba(255, 184, 0, 0.35)',
  },
  verde: {
    id: 'verde',
    nombre: 'Emerald Matrix',
    tag: 'Esmeralda & Lima',
    accent: '#10B981',
    accentSecondary: '#84CC16',
    gradient: ['#10B981', '#84CC16'],
    bg: '#0F1713',
    surface: '#16231C',
    surfaceHighlight: '#1F3328',
    border: 'rgba(16, 185, 129, 0.22)',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  cyberpunk: {
    id: 'cyberpunk',
    nombre: 'Cyberpunk Neon',
    tag: 'Violeta & Fucsia',
    accent: '#C026D3',
    accentSecondary: '#EC4899',
    gradient: ['#9333EA', '#EC4899'],
    bg: '#140F1D',
    surface: '#22182E',
    surfaceHighlight: '#2F2040',
    border: 'rgba(192, 38, 211, 0.25)',
    glow: 'rgba(192, 38, 211, 0.35)',
  },
  oceano: {
    id: 'oceano',
    nombre: 'Deep Ocean',
    tag: 'Turquesa & Zafiro',
    accent: '#06B6D4',
    accentSecondary: '#3B82F6',
    gradient: ['#06B6D4', '#3B82F6'],
    bg: '#0D151D',
    surface: '#14222F',
    surfaceHighlight: '#1C3142',
    border: 'rgba(6, 182, 212, 0.22)',
    glow: 'rgba(6, 182, 212, 0.35)',
  },
  vaporwave: {
    id: 'vaporwave',
    nombre: 'Vaporwave Dream',
    tag: 'Rosa & Nebulosa',
    accent: '#FB7185',
    accentSecondary: '#A78BFA',
    gradient: ['#F43F5E', '#8B5CF6'],
    bg: '#181119',
    surface: '#271A27',
    surfaceHighlight: '#372337',
    border: 'rgba(251, 113, 133, 0.22)',
    glow: 'rgba(251, 113, 133, 0.35)',
  },
  venom: {
    id: 'venom',
    nombre: 'Toxic Viper',
    tag: 'Veneno & Neón',
    accent: '#84CC16',
    accentSecondary: '#14B8A6',
    gradient: ['#A3E635', '#14B8A6'],
    bg: '#12160F',
    surface: '#1B2416',
    surfaceHighlight: '#26331F',
    border: 'rgba(132, 204, 22, 0.24)',
    glow: 'rgba(132, 204, 22, 0.35)',
  },
  magma: {
    id: 'magma',
    nombre: 'Magma Core',
    tag: 'Lava & Volcán',
    accent: '#FF4D00',
    accentSecondary: '#B91C1C',
    gradient: ['#FF4D00', '#B91C1C'],
    bg: '#170F0F',
    surface: '#281515',
    surfaceHighlight: '#381C1C',
    border: 'rgba(255, 77, 0, 0.22)',
    glow: 'rgba(255, 77, 0, 0.35)',
  },
  titanio: {
    id: 'titanio',
    nombre: 'Ashen Frost',
    tag: 'Platino & Hielo',
    accent: '#E2E8F0',
    accentSecondary: '#94A3B8',
    gradient: ['#E2E8F0', '#64748B'],
    bg: '#131417',
    surface: '#202227',
    surfaceHighlight: '#2D3037',
    border: 'rgba(226, 232, 240, 0.2)',
    glow: 'rgba(226, 232, 240, 0.3)',
  },
};

export const TEMAS: Record<TemaId, string> = {
  rojo: TEMAS_CONFIG.rojo.accent,
  azul: TEMAS_CONFIG.azul.accent,
  amarillo: TEMAS_CONFIG.amarillo.accent,
  verde: TEMAS_CONFIG.verde.accent,
  cyberpunk: TEMAS_CONFIG.cyberpunk.accent,
  oceano: TEMAS_CONFIG.oceano.accent,
  vaporwave: TEMAS_CONFIG.vaporwave.accent,
  venom: TEMAS_CONFIG.venom.accent,
  magma: TEMAS_CONFIG.magma.accent,
  titanio: TEMAS_CONFIG.titanio.accent,
};

type ThemeContextType = {
  accent: string;
  accentSecondary: string;
  gradient: [string, string];
  bg: string;
  surface: string;
  surfaceHighlight: string;
  border: string;
  glow: string;
  temaId: TemaId;
  tema: TemaConfig;
  setTema: (id: TemaId) => void;
};

const temaDefecto = TEMAS_CONFIG.rojo;

const ThemeContext = createContext<ThemeContextType>({
  accent: temaDefecto.accent,
  accentSecondary: temaDefecto.accentSecondary,
  gradient: temaDefecto.gradient,
  bg: temaDefecto.bg,
  surface: temaDefecto.surface,
  surfaceHighlight: temaDefecto.surfaceHighlight,
  border: temaDefecto.border,
  glow: temaDefecto.glow,
  temaId: 'rojo',
  tema: temaDefecto,
  setTema: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [temaId, setTemaId] = useState<TemaId>('rojo');

  useEffect(() => {
    cargarTema();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) cargarTema();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function cargarTema() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase.from('profiles').select('tema').eq('id', uid).single();
      if (data?.tema && data.tema in TEMAS_CONFIG) {
        setTemaId(data.tema as TemaId);
      }
    } catch {
      // Si falla la consulta de red, mantiene el tema actual
    }
  }

  async function setTema(id: TemaId) {
    setTemaId(id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        await supabase.from('profiles').update({ tema: id }).eq('id', uid);
      }
    } catch {
      // Actualización optimista ya realizada
    }
  }

  const currentTema = TEMAS_CONFIG[temaId] || temaDefecto;

  return (
    <ThemeContext.Provider
      value={{
        accent: currentTema.accent,
        accentSecondary: currentTema.accentSecondary,
        gradient: currentTema.gradient,
        bg: currentTema.bg,
        surface: currentTema.surface,
        surfaceHighlight: currentTema.surfaceHighlight,
        border: currentTema.border,
        glow: currentTema.glow,
        temaId,
        tema: currentTema,
        setTema,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}