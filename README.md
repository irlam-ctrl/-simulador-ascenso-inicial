# Simulador de Ascenso EBR Inicial — V5.3.1

## Cambios
- “Prueba” pasa a mostrarse como “Año” en la interfaz.
- El botón visible sigue llamándose “Restablecer progreso”.
- Antes de reiniciar, guarda una Etapa con:
  - preguntas resueltas,
  - aciertos al primer intento,
  - reintentadas,
  - favoritas,
  - estado completo de práctica,
  - historial y mejor resultado de exámenes.
- Después de guardar la etapa, práctica e historial activo de exámenes comienzan desde cero.
- Los avances anteriores permanecen visibles en “Historial de progreso”.
- Con sesión iniciada, las etapas se guardan en Supabase.
- No se elimina la cuenta Auth ni el banco de preguntas.

## Publicación
Subir a GitHub: index.html, styles.css, app.js, cloud.js y questions.js.

## Supabase
Ejecutar una vez `supabase-v5.3.1-etapas.sql` en SQL Editor.
La tabla `exam_sessions` de V5.3 debe mantenerse.

### Terminología de la interfaz
El sistema interno usa registros/etapas para conservar cada ciclo de estudio, pero esa terminología no se muestra a Mara. La interfaz usa únicamente “Restablecer progreso”, “Historial de progreso” y “Progreso 1, 2, 3…”.
