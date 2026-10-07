# Simulador de Ascenso EBR Inicial — V5.3

Cambios principales:
- Estadísticas de práctica separadas del modo examen.
- Práctica: Respondidas, % al primer intento, Reintentadas y Favoritas.
- Examen: no muestra corrección ni explicación durante el intento.
- Resultado del examen al entregar: correctas, incorrectas, porcentaje y tiempo.
- Historial de exámenes separado; los errores de examen no alteran las estadísticas de práctica.
- Si se selecciona una prueba concreta, el examen usa sus 60 preguntas oficiales.
- Si se selecciona “Todas”, crea un examen aleatorio de 60 preguntas.
- El historial funciona localmente aun sin configurar la nueva tabla de Supabase.
- `supabase-v5.3.sql` habilita la sincronización del historial de exámenes entre dispositivos.

Para publicar en GitHub Pages, reemplazar:
index.html, styles.css, app.js, cloud.js, questions.js.
El archivo SQL NO se sube al sitio: se ejecuta una vez en Supabase > SQL Editor.
