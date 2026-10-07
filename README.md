# Simulador de Ascenso EBR Inicial — V5.4.1

Corrección crítica del Modo práctica:
- La práctica queda fijada al conjunto exacto obtenido al pulsar “Comenzar práctica”.
- Ejemplo: Año 2019 + Comunicación = 19 preguntas -> siempre X de 19.
- Anterior, Siguiente y la cuadrícula solo recorren esas 19 preguntas.
- Nunca cambia silenciosamente al conjunto completo de 60 preguntas del año.
- La referencia oficial (Año y número de pregunta) se mantiene como metadato.
- No requiere cambios en Supabase ni SQL.
