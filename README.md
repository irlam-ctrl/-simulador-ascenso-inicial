# Simulador V5.4.4

Corrección del desfase del navegador:
- Se identificó la causa real del error de V5.4.3.
- En el primer render, el botón central reemplazaba sus spans internos por texto.
- En el segundo render, JavaScript intentaba actualizar esos spans ya eliminados y se detenía.
- Por eso arriba podía aparecer “2 de 60” mientras el botón y la cuadrícula seguían en “1”.
- Ahora el botón central se actualiza como una sola unidad y no depende de elementos internos que desaparecen.
- El contador superior, botón central y cuadrícula usan el mismo índice `i`.
- cloud.js y questions.js no se modificaron.
- No requiere cambios en Supabase.
