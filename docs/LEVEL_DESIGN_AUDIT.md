# Polar Shift — auditoría estática de los seis niveles

> Alcance: revisión de los datos actuales de `src/game/levels.ts` contra las reglas oficiales de `GAMEPLAY_RULES.md`. Es una auditoría estática de geometría y textos, no una sesión de juego ni una prueba de navegador.

## Resumen

- Los seis niveles utilizan plataformas compartidas en su ruta principal, lo que mantiene viable el movimiento sincronizado del modo Espejo.
- Los textos de los niveles 1, 2, 3 y 6 contenían referencias obsoletas a compañeros, doble personaje o cooperación.
- Se detectaron dos solapamientos directos entre estrellas y púas en el nivel 3. Las estrellas se han desplazado dentro de las plataformas correspondientes y se añadió una prueba automática que impide volver a introducir solapamientos estrella/púa.
- El nivel 4 utiliza dos muros exclusivos de fase. Son barreras de Contraste, pero no pueden ser barreras físicas en Espejo; este modo debe probarse para comprobar que la lectura visual sigue siendo honesta.
- En el nivel 6, la zona de la primera estrella se cruza con el recorrido horizontal de la goma móvil y tiene una separación vertical muy pequeña. Requiere una prueba de juego para validar que puede recogerse de forma justa.

## Auditoría por nivel

### Página 1 — El Primer Trazo

**Función prevista:** enseñar el escenario, los huecos, los peligros alternados y la lectura de las dos realidades.

**Datos observados:** plataformas `BOTH`; púas WHITE en los huecos y una púa BLACK sobre la plataforma intermedia; dos estrellas.

**Evaluación:** buena base introductoria. En Contraste permite descubrir el cambio de fase; en Espejo, los peligros de ambos tipos se combinan en la ruta común.

**Validación pendiente:** comprobar que el jugador entiende por qué una púa que se ve en una fase puede ser letal al cambiar de realidad, y que las dos vistas del modo Espejo no generan una lectura ambigua.

### Página 2 — Trazos Cruzados

**Función prevista:** enseñar el trazo como puente y la proyección entre realidades.

**Datos observados:** cuatro plataformas `BOTH`, tres grupos de púas y dos estrellas asignadas a dimensiones distintas.

**Evaluación:** la geometría compartida es apropiada para Espejo. El texto anterior mencionaba un compañero al que ayudar, por lo que se ha sustituido por una explicación del comportamiento real del trazo.

**Validación pendiente:** comprobar que el jugador descubre que el trazo no sostiene en su origen y que sí sostiene en la realidad opuesta; en Espejo, verificar la proyección horizontal desde cualquiera de las dos vistas.

### Página 3 — La Escalera Intermitente

**Función prevista:** enseñar el ascenso por plataformas, el doble salto y la lectura de peligros sobre escalones.

**Datos observados:** escalera de plataformas `BOTH`, púas en la parte baja y dos peligros colocados sobre escalones.

**Hallazgo corregido:** la estrella `star3_1` se solapaba con la púa `s3_4`; la estrella `star3_2` se solapaba con la púa `s3_5`. En Contraste, cada estrella estaba en la misma dimensión que la púa que ocupaba su espacio. En Espejo, además, los peligros de ambas realidades son letales en la ruta compartida. Se reubicaron las estrellas a `(350, 290)` y `(490, 210)`, respectivamente.

**Validación pendiente:** probar la recogida de ambas estrellas desde aproximaciones razonables y medir si el nivel enseña el doble salto sin exigir precisión excesiva.

### Página 4 — El Muro Ilusorio & La Goma

**Función prevista:** introducir la goma móvil y las barreras exclusivas de fase.

**Datos observados:** dos muros verticales, uno WHITE y otro BLACK; una goma patrullera WHITE; una púa WHITE.

**Evaluación:** el contraste de barreras tiene sentido en Contraste. En Espejo, los muros exclusivos no participan en la colisión compartida y no deben funcionar ni presentarse como barreras sólidas. Esto reduce una parte importante del reto espacial original.

**Validación pendiente:** jugarlo en ambos modos. Decidir después si el nivel debe tener una variante de geometría compatible con Espejo o si su reto se apoya deliberadamente en la goma y los peligros compartidos.

### Página 5 — Lluvia de Tinta

**Función prevista:** aprender a anticipar peligros periódicos en movimiento.

**Datos observados:** cuatro plataformas `BOTH`, dos huecos con púas y cinco gotas de tinta con temporizadores y velocidades diferentes.

**Evaluación:** es el nivel más claramente centrado en anticipación temporal. La geometría compartida es compatible con Espejo y las gotas de ambas realidades se combinan como peligros de la ruta.

**Validación pendiente:** medir si los ciclos de las gotas permiten ventanas legibles, si existe tiempo suficiente para reaccionar y si las estrellas son alcanzables sin depender de azar o ensayo excesivo.

### Página 6 — El Reflejo Final

**Función prevista:** examen final que combina desplazamiento horizontal, ascenso, peligros y dibujo.

**Datos observados:** plataformas `BOTH`, cuatro grupos de púas, una goma móvil, dos gotas de tinta y tres estrellas.

**Hallazgo de texto:** la descripción hablaba de llevar a ambos personajes a la meta e intercambiar posiciones con `SHIFT`. Se ha sustituido por una descripción coherente con los dos modos.

**Riesgo de balance:** la goma se desplaza por un tramo horizontal amplio que cruza la zona X de `star6_1`; además, la estrella queda muy cerca de la parte superior de la goma. Puede ser una recogida basada en temporización, pero necesita prueba real.

**Validación pendiente:** comprobar que la goma y las púas dejan ventanas de movimiento, que las estrellas son alcanzables y que el nivel no se convierte en una secuencia de esperas o muertes inevitables.

## Siguiente ciclo recomendado

1. Probar cada nivel primero en Contraste y luego en Espejo con una lista de verificación común.
2. Registrar tiempo hasta completar, muertes, cambios de realidad/fase, tinta gastada y estrellas recogidas.
3. Pedir a jugadores nuevos que expliquen las reglas después de jugar el nivel 1 y el nivel 2, sin leer el manual.
4. Rediseñar el nivel 4 para Espejo si el muro desaparecido elimina demasiado reto.
5. Ajustar el nivel 6 solo después de observar la interacción real con la goma y las ventanas entre peligros.
