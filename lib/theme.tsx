import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

export const TEMAS = {
  rojo: '#E1483C',
  azul: '#3B6EA8',
  amarillo: '#D9B23C',
  verde: '#4C8C5B',
} as const;

type TemaId = keyof typeof TEMAS;

type ThemeContextType = {
  accent: string;
  temaId: TemaId;
  setTema: (id: TemaId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  accent: TEMAS.rojo,
  temaId: 'rojo',
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
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.from('profiles').select('tema').eq('id', uid).single();
    if (data?.tema && data.tema in TEMAS) setTemaId(data.tema as TemaId);
  }

  async function setTema(id: TemaId) {
    setTemaId(id);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (uid) await supabase.from('profiles').update({ tema: id }).eq('id', uid);
  }

  return (
    <ThemeContext.Provider value={{ accent: TEMAS[temaId], temaId, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}