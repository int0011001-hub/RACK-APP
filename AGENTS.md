# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# RACK — Contexto completo del proyecto

> Documento de traspaso. Reemplaza y amplía la versión anterior de este archivo con todo lo trabajado en la sesión de Claude previa a esta. Léelo entero antes de tocar código.

## 1. Qué es RACK y para quién

RACK es una app de fitness para **web, iOS y Android** (una sola base de código, React Native + Expo). Está pensada para gente que entrena en el gimnasio 2-5 veces por semana (fuerza/hipertrofia/mantenimiento), que ya lleva registro manual de sus entrenamientos (libreta, notas del móvil, Excel) y busca algo más cómodo.

**Objetivo del MVP:** que registrar una serie durante el entrenamiento sea más rápido y más cómodo que el método manual que el usuario ya usa. Esa es la vara de medir para cualquier decisión de diseño: si una función añade fricción al momento de registrar, es sospechosa por defecto.

**Filosofía de diseño ya establecida:**
- Fricción mínima al registrar series (nada de botones "Guardar", todo autoguarda al escribir).
- Borrado suave sin pedir confirmación cuando no hay nada que perder (confirmar solo lo destructivo de verdad, como borrar un día con ejercicios dentro).
- Actualizaciones optimistas de UI: el estado local se actualiza al instante y la escritura a Supabase va en paralelo, no se espera a re-consultar la base de datos para reflejar un cambio.
- Consistencia: cualquier función nueva debe encajar con los patrones ya establecidos (temas de color, los dos estilos de registro, etc.) antes de proponerse como algo aparte.

## 2. El usuario (Int) y cómo prefiere trabajar

- No es programador. Hasta ahora construía copiando y pegando código manualmente en VS Code, probando en su móvil Android vía Expo Go.
- **Presupuesto cero.** Cualquier solución con coste recurrente (APIs de pago, servicios de terceros no gratuitos) debe señalarse explícitamente y aplazarse por defecto hasta que la app genere ingresos.
- Prefiere entender qué hace cada cambio en una frase en cristiano, no solo ver el código.
- Ante un error: primero diagnosticar la causa raíz (pedir capturas si hace falta), no proponer parches a ciegas.
- Acaba de decidir pasar a programar con **Google Antigravity CLI** en vez de copiar/pegar parches manuales — como agente con acceso directo a los archivos, ya no debería hacer falta el formato "Busca / Cámbialo por" que se usaba en Claude; puede editar el repo directamente. Aun así, mantén el mismo criterio de fondo: cambios explicados en cristiano, diagnóstico antes de parchear, y nunca romper la consistencia de lo ya construido.

## 3. Stack técnico

- **Framework:** React Native + Expo SDK 57 (subido desde 54 por incompatibilidad con Expo Go del móvil del usuario — la versión del proyecto y la de la app Expo Go instalada en el móvil deben coincidir siempre).
- **Backend:** Supabase (PostgreSQL con Row Level Security).
- **Estado del cliente:** `useState` / `useFocusEffect` con actualizaciones optimistas locales. React Query está instalado en `_layout.tsx` pero **no se usa** — no ha hecho falta hasta ahora, no lo introduzcas sin motivo.
- **Navegación:** Expo Router (carpeta `app/`).
- **Imágenes de perfil:** Supabase Storage, bucket `profile-media` con RLS.
- **Mapa muscular:** `react-native-body-highlighter`; las imágenes anatómicas se generaron con ChatGPT (GPT Image) y se verificaron con PIL comprobando el canal alfa en las esquinas (una comprobación visual de "se ve transparente" no basta, hay fondos sólidos que engañan al ojo).
- **Gráficas de progreso:** `react-native-svg`, dibujadas a mano (sin librería de charts).
- **Drag & drop:** `react-native-draggable-flatlist` + `gesture-handler` + `reanimated` — usado para reordenar días, ya implementado y funcionando.
- **Login con Google:** el código ya existe (`app/login.tsx`, `expo-web-browser` + `signInWithOAuth`) y las credenciales están configuradas, pero está **aparcado permanentemente mientras se use Expo Go** — el redirect `exp://` no vuelve de forma fiable a la app en Android. Solo funcionará con una development build real (esquema `rack://` nativo).
- **Entorno Windows/PowerShell:**
  - El proyecto tiene `.npmrc` con `legacy-peer-deps=true`.
  - Tras tocar `babel.config.js`, reiniciar siempre con `npx expo start -c` (caché limpia).
  - Tras instalar paquetes nuevos, ejecutar `npx expo install --check` para alinear versiones.
  - Reanimated 4 movió su plugin de Babel a un paquete separado `react-native-worklets`; si aparece `Cannot find module 'react-native-worklets/plugin'`, basta con `npx expo install react-native-worklets` (no hace falta tocar `babel.config.js`, el plugin viejo de reanimated ya lo referencia internamente).

## 4. Estructura de pantallas (`app/`)

- `_layout.tsx`, `login.tsx`, `onboarding.tsx`, `welcome.tsx`
- `index.tsx` — "Mis rutinas"
- `rutina/nueva.tsx`
- `rutina/[id]/nombre.tsx`
- `rutina/[id]/index.tsx` — pantalla principal: días, ejercicios, series, progreso. La más grande y la que más ha cambiado esta sesión (ver sección 6).
- `rutina/[id]/editor.tsx` — "Modo editor" por rutina: mostrar/ocultar RIR, tamaño de hoja (compacto/normal/grande), reordenar días arrastrando.
- `perfil/index.tsx` — avatar/portada, @handle, bio, lista de ajustes.
- `perfil/datos.tsx`, `perfil/apariencia.tsx` (color de acento), `perfil/estilo.tsx` (acordeón vs notas), `perfil/hoja.tsx` (oscura/clara).
- `musculos/index.tsx` — mapa interactivo frontal/trasera con ejercicios por zona.
- `components/BottomNav.tsx`, `lib/supabase.ts`, `lib/theme.tsx` (ThemeProvider global).

**`rutina/[id]/index.tsx` en detalle:** carga diferida por día, dos estilos de registro intercambiables por preferencia del usuario (acordeón / bloc de notas), RIR opcional controlado por `rutina.mostrar_rir`, renombrar ejercicios/días con toque o mantener pulsado, los días pueden repetir nombre, los ejercicios no pueden repetirse dentro del mismo día, gráfica SVG de 1RM estimado (fórmula de Epley) o volumen total con puntos coloreados verde/amarillo según si hay más o menos series que al inicio del histórico.

**Deuda técnica ya resuelta:** `app/perfil/editor.tsx` era una pantalla huérfana (escribía en `profiles.mostrar_rir`, columna que ya no lee nada tras mover esa lógica a `rutina.mostrar_rir`). Se borró el archivo y se quitó la fila "Modo editor" de `perfil/index.tsx`.

## 5. Modelo de datos (estado actual en Supabase)

Tablas base (sin cambios desde el inicio del proyecto):

```sql
profiles (id, nombre, peso, edad, altura, nivel, handle, bio, foto_url, fondo_url, tema, estilo_registro, estilo_hoja, mostrar_rir, created_at)
catalogo_ejercicio (id, nombre, es_personalizado, usuario_id, grupo_muscular[], created_at)
rutina (id, usuario_id, titulo, mostrar_rir, tamano_hoja, created_at, updated_at)
dia (id, rutina_id, nombre, orden)
ejercicio_dia (id, dia_id, catalogo_ejercicio_id, orden, activo, fecha_ultimo_registro)
```

**Cambio grande de esta sesión — tipos de series avanzados.** `serie_actual` y `serie_historial` dejaron de guardar `kg`/`reps` directamente; ahora una serie puede tener uno o varios "tramos" (para drop sets, cluster sets, rest-pause, myo-reps, que comparten la misma forma de guardado: varios bloques de peso/reps dentro de la misma serie).

```sql
serie_actual (id, ejercicio_dia_id, numero_serie, tipo_serie, rir)
serie_historial (id, ejercicio_dia_id, fecha, numero_serie, tipo_serie, rir)
tramo_serie (id, serie_actual_id, orden, kg, reps)         -- FK a serie_actual, on delete cascade
tramo_historial (id, serie_historial_id, orden, kg, reps)  -- FK a serie_historial, on delete cascade
```

- `tipo_serie` acepta solo dos valores: `'recta'` (una serie normal, un único tramo) y `'multitramo'` (agrupa drop set / cluster set / rest-pause / myo-reps — todas comparten estructura, solo cambia la técnica de ejecución que el usuario ya conoce, no hace falta que la app las distinga).
- Las columnas `kg`/`reps` originales de `serie_actual`/`serie_historial` **se dejaron sin borrar** a propósito, como red de seguridad, hasta confirmar que la pantalla nueva funciona bien de principio a fin. Se pueden borrar en una limpieza posterior.
- RLS en `tramo_serie`/`tramo_historial`: mismas reglas que las tablas padre, siguiendo la cadena `tramo → serie → ejercicio_dia → dia → rutina → usuario_id = auth.uid()`. El nombre de constraint de check usado fue `serie_actual_tipo_serie_check` / `serie_historial_tipo_serie_check` (confirmado porque un error de Postgres lo mostró explícitamente).

⚠️ **Importante — verificar antes de seguir:** en el último intercambio de la sesión anterior se entregaron (1) el SQL para pasar de 5 tipos de serie a solo 2 (`recta`/`multitramo`) y (2) un parche de código para `rutina/[id]/index.tsx` que corrige dos bugs (el ancho del campo RIR, que cortaba la palabra "FALLO" y probablemente rompía el toque en series 2+; y que los tramos sobrantes no se borraban al volver una serie de "multitramo" a "recta"). **No hay confirmación de que el usuario haya ejecutado ese SQL ni aplicado ese parche todavía.** Antes de construir nada nuevo sobre tipos de serie, comprueba el estado real de la constraint `tipo_serie` en Supabase y el contenido actual de `rutina/[id]/index.tsx` en vez de asumir que ya se aplicó.

## 6. Cambios hechos en la sesión anterior (con Claude), en orden

1. **Bug de arranque:** `Cannot find module 'react-native-worklets/plugin'` — resuelto instalando `react-native-worklets` (sin tocar `babel.config.js`).
2. **Deuda técnica:** borrado `app/perfil/editor.tsx` y su fila de acceso en `perfil/index.tsx`.
3. **Diseño de tipos de serie avanzados:** se explicaron drop set, cluster set, rest-pause, myo-reps y se decidió modelarlos como "tramos" dentro de una serie (ver sección 5). Superserie/serie gigante/circuito quedaron explícitamente fuera — son agrupación de **ejercicios**, no de series, y se abordarán en otro momento.
4. **Migración SQL inicial:** columna `tipo_serie` + tablas `tramo_serie`/`tramo_historial` + migración de datos existentes + políticas RLS. Ejecutada y confirmada por el usuario.
5. **Reescritura completa de `rutina/[id]/index.tsx`** para soportar tramos: selector de tipo de serie, edición de tramos, RIR único por serie, histórico y gráfica de progreso sumando/comparando tramos.
6. **Feedback de UI del usuario:** el selector de 5 chips siempre visibles quedaba tosco, sobre todo en modo notas. Se descartó la idea de un editor tipo HUD de videojuego con previsualización (mismo motivo que ya se había aparcado el editor de HUD libre: no funciona en Expo Go, demasiado esfuerzo de frontend para el valor que aporta al MVP). Se implementó en su lugar un **selector colapsable**: una etiqueta pequeña con el tipo actual que, al tocarla, despliega las opciones.
7. **Simplificación de 5 a 2 tipos de serie:** el usuario notó que drop set/cluster/rest-pause/myo-reps comparten exactamente la misma estructura de guardado, así que se redujeron a `recta` y `multitramo`, con un icono ⓘ que explica (vía `Alert.alert`) qué técnicas cubre "multitramo" y cómo usarlas.
8. **RIR con placeholder "FALLO":** cuando el campo está vacío, se lee "FALLO" en vez de un guion — cambio puramente visual (placeholder), no se guarda ningún valor especial en la base de datos, `rir` sigue siendo `null` si no se rellena.
9. **Dos bugs reportados tras probar en el móvil** (parche entregado, ver advertencia de la sección 5):
   - El campo RIR (ancho fijo de 40px) cortaba la palabra "FALLO" y probablemente rompía el área táctil en la Serie 2, 3... por el `flexWrap` de la fila en modo notas. Se ensanchó a 58px.
   - Al cambiar una serie de "multitramo" de vuelta a "recta", los tramos extra no se borraban ni en pantalla ni en Supabase. Se corrigió `cambiarTipoSerie` para borrarlos en ambos sitios.
10. **Primer error de SQL de la sesión:** al aplicar la migración de 5→2 tipos, el orden de los pasos era incorrecto (se intentaba escribir `'multitramo'` antes de quitar la restricción vieja que no lo permitía). Se corrigió el orden: primero `drop constraint`, luego migrar datos, luego `add constraint` con los 2 valores nuevos.

## 7. Próximos pasos acordados (pendientes de construir)

1. **Cronómetro de descanso.** El usuario lo quiere integrado en una **notificación pasiva/persistente**, como la del contador de pasos, con otras funciones además del propio cronómetro (sin especificar aún cuáles). Esto **requiere una development build** — no es posible en Expo Go. Antes de construirlo hay que retomar la conversación sobre generar una build (ver Fase 2, más abajo — se había aparcado por falta de necesidad inmediata).
2. **Tipos de series avanzados** — en curso, ver advertencia de la sección 5 antes de continuar.
3. **Preguntas de metodología de entrenamiento en el onboarding** (fuerza/hipertrofia/resistencia; full body/upper-lower/PPL/bro split; powerlifting/calistenia/crossfit/HIIT). Aún sin decidir cómo se traduce esa información en funcionalidad real de la app. Se acordó retomarlo después de cerrar los tipos de serie.

## 8. Explícitamente fuera del MVP (Fase 2)

- Ranking/leaderboard tipo "Macadam" con mapa de spots de gimnasio (requeriría verificación por vídeo y moderación de contenido).
- @usuario como identidad social pública, chat entre amigos, insignias/logros, rol de coach.
- Importar rutinas desde Excel/fotos/notas con IA — aplazado por el coste de una API de visión, incompatible con presupuesto cero.
- Editor de HUD libre (arrastrar/redimensionar elementos de pantalla) — sustituido por presets fijos (Compacto/Normal/Grande), ya implementado. La misma razón (esfuerzo de frontend + no viable en Expo Go) descartó también la idea equivalente para el selector de tipo de serie.
- Mapa muscular "analítico" por cabeza muscular — la librería `react-native-body-highlighter` no lo soporta. Enfoque aprobado para cuando se retome: subcategorías de texto en la lista de ejercicios, no un segundo mapa visual.
- Contador de pasos con notificación persistente — necesita development build, no funciona en Expo Go.
- Notificación de apertura de app pulida — reservada para justo antes del lanzamiento.
- Generar un `.apk` vía EAS Build — descartado por ahora por el usuario (encontró otra forma de registrar entrenamientos mientras tanto). Retomar si necesita usar la app sin portátil, para publicar, o para el cronómetro con notificación persistente (punto 1 de la sección 7).

## 9. Decisiones y aprendizajes de diseño (para no repetir debates ya cerrados)

- Validar con usuarios reales antes de invertir en funciones de Fase 2.
- Borrado suave (`serie_historial`) elegido como patrón para preservar el histórico de entrenamientos.
- Una comprobación de canal alfa con PIL en las esquinas distingue de forma fiable la transparencia RGBA real de un fondo sólido que visualmente parece transparente — vale la pena verificarlo en vez de fiarse del ojo.
- Las imágenes anatómicas deben generarse en una sola conversación con la IA de imágenes para mantener consistencia de estilo entre la vista frontal y la trasera.
- El sistema de dos estilos de registro (acordeón vs. bloc de notas) está pensado para ser intercambiable según la preferencia de cada usuario, no para que uno sustituya al otro.

