# Simulador de Ascenso EBR Inicial — V5.4.3

Base: V5.4.2.

Corrección de navegación:
- La posición actual se calcula una sola vez desde `i`.
- El contador superior, el botón “Pregunta X de Y” y la casilla resaltada de la cuadrícula usan exactamente esa misma posición.
- Al tocar una casilla, se actualiza `i` y se vuelve a renderizar toda la navegación.
- El antiguo botón de “siguiente” posterior a una respuesta correcta permanece oculto; las flechas del navegador son la navegación única de práctica.
- Tema y Ciclo siguen eliminados; se conserva Año.
- `cloud.js` y `questions.js` no fueron modificados.
- No requiere cambios en Supabase.
