# Simulador de Ascenso EBR Inicial — V5.4

Corrección de navegación en Modo práctica:
- El navegador aparece SIEMPRE que haya una práctica activa, sin importar Tema, Ciclo, Año o Estado.
- El contador superior y el navegador usan exactamente el mismo conjunto filtrado.
- Si el filtro devuelve 13 preguntas, ambos muestran “X de 13”.
- La cuadrícula contiene exactamente esas 13 preguntas.
- Cada casilla muestra la posición en la práctica y debajo la referencia oficial, por ejemplo “2019 · P14”.
- Anterior y Siguiente recorren el mismo conjunto filtrado.
- Correctas, falladas/reintentadas y favoritas conservan sus indicadores.
- No requiere cambios en Supabase ni SQL adicional.
