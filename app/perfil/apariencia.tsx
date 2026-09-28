import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TEMAS_CONFIG, useTheme, TemaId } from '../../lib/theme';

export default function Apariencia() {
  const { temaId, tema, setTema, bg, surface, border, accent, gradient } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={16} color="#8B8D97" />
        <Text style={styles.back}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Apariencia</Text>
      <Text style={styles.subtitle}>
        Personaliza los degradados, la atmósfera y el estilo visual de toda tu app con mezclas inspiradas en Discord Nitro y Google.
      </Text>

      {/* Vista Previa en Vivo (Live Preview) */}
      <View style={[styles.previewCard, { backgroundColor: surface, borderColor: border }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewHeaderTag}>VISTA PREVIA EN VIVO</Text>
          <View style={[styles.activePill, { borderColor: accent, backgroundColor: `${accent}1A` }]}>
            <View style={[styles.dotIndicator, { backgroundColor: accent }]} />
            <Text style={[styles.activePillText, { color: accent }]}>{tema.nombre}</Text>
          </View>
        </View>

        {/* Barra de degradado panorámica */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.previewGradientBar}
        />

        {/* Simulación de interfaz dentro de la app */}
        <View style={styles.mockupContainer}>
          <View style={styles.mockupHeaderRow}>
            <View style={styles.mockupTitleGroup}>
              <Text style={styles.mockupRoutineTitle}>Rutina Hipertrofia · Día 1</Text>
              <Text style={styles.mockupExercise}>Press de Banca con Barra</Text>
            </View>
            <View style={[styles.mockupBadge, { backgroundColor: `${accent}20`, borderColor: accent }]}>
              <Text style={[styles.mockupBadgeText, { color: accent }]}>1RM 105kg</Text>
            </View>
          </View>

          {/* Botón de Progreso con esquinas a 90º y color de apariencias */}
          <View style={styles.mockupActionsRow}>
            <View style={[styles.mockupProgresoBtn, { borderColor: accent }]}>
              <Text style={[styles.mockupProgresoText, { color: accent }]}>Ver progreso</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85}>
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mockupActionBtn}
              >
                <Ionicons name="flash" size={13} color="#fff" />
                <Text style={styles.mockupActionText}>Registrar Serie</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Muestrario de colores mezclados */}
        <View style={styles.paletteSummary}>
          <View style={styles.swatchMixWrap}>
            <View style={[styles.swatchCircle, { backgroundColor: tema.accent }]} />
            <View style={[styles.swatchCircle, styles.swatchOverlap, { backgroundColor: tema.accentSecondary }]} />
          </View>
          <Text style={styles.paletteSummaryText}>{tema.tag}</Text>
        </View>
      </View>

      {/* Sección Selector de Temas */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Mezclas de color disponibles</Text>
        <Text style={styles.countBadge}>{Object.keys(TEMAS_CONFIG).length} temas</Text>
      </View>
      <Text style={styles.sectionDesc}>
        Elige un tema para transformar acentos, gradientes de acción, bordes y el fondo de toda la aplicación.
      </Text>

      {/* Rejilla de los 10 temas */}
      <View style={styles.themeGrid}>
        {(Object.values(TEMAS_CONFIG) as typeof tema[]).map((t) => {
          const isSelected = temaId === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.8}
              style={[
                styles.themeCard,
                { backgroundColor: t.surface },
                isSelected
                  ? { borderColor: t.accent, borderWidth: 2, shadowColor: t.accent, elevation: 5 }
                  : { borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 },
              ]}
              onPress={() => setTema(t.id as TemaId)}
            >
              {/* Barra de degradado superior */}
              <LinearGradient
                colors={t.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardGradientStripe}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  {/* Círculos solapados de la mezcla */}
                  <View style={styles.colorPill}>
                    <View style={[styles.miniCircle, { backgroundColor: t.accent }]} />
                    <View style={[styles.miniCircle, styles.miniOverlap, { backgroundColor: t.accentSecondary }]} />
                  </View>

                  {/* Icono de seleccionado */}
                  {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: t.accent }]}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  ) : (
                    <View style={styles.uncheckCircle} />
                  )}
                </View>

                <Text style={[styles.cardTitle, isSelected && { color: '#fff' }]}>
                  {t.nombre}
                </Text>
                <Text style={[styles.cardTag, isSelected && { color: t.accent }]}>
                  {t.tag}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nota informativa de pie */}
      <View style={[styles.infoBanner, { backgroundColor: surface, borderColor: border }]}>
        <Ionicons name="color-palette-outline" size={20} color={accent} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>Diseño integral de la app</Text>
          <Text style={styles.infoBannerDesc}>
            Cada mezcla equilibra el contraste cromático para mantener la legibilidad durante el entrenamiento, aplicando gradientes en botones de acción, bordes a 90º en el botón de progreso y tonos inmersivos en la interfaz.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  back: {
    color: '#8B8D97',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    color: '#ECE8DE',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8B8D97',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewHeaderTag: {
    color: '#8B8D97',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewGradientBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
    width: '100%',
  },
  mockupContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mockupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  mockupTitleGroup: {
    flex: 1,
  },
  mockupRoutineTitle: {
    color: '#ECE8DE',
    fontSize: 14,
    fontWeight: '700',
  },
  mockupExercise: {
    color: '#8B8D97',
    fontSize: 12,
    marginTop: 2,
  },
  mockupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  mockupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mockupActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mockupProgresoBtn: {
    borderWidth: 1,
    borderRadius: 0, // Esquinas a 90 grados
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mockupProgresoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mockupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  mockupActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  paletteSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  swatchMixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatchCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#17181B',
  },
  swatchOverlap: {
    marginLeft: -6,
  },
  paletteSummaryText: {
    color: '#8B8D97',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#ECE8DE',
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    color: '#8B8D97',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionDesc: {
    color: '#8B8D97',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  themeCard: {
    width: '48.5%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardGradientStripe: {
    height: 6,
    width: '100%',
  },
  cardContent: {
    padding: 12,
    paddingTop: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  miniOverlap: {
    marginLeft: -8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardTitle: {
    color: '#ECE8DE',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTag: {
    color: '#8B8D97',
    fontSize: 11,
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerTitle: {
    color: '#ECE8DE',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoBannerDesc: {
    color: '#8B8D97',
    fontSize: 11,
    lineHeight: 16,
  },
});