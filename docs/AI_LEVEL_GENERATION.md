# Estudio técnico: generación infinita y adaptativa de niveles con IA

**Estado:** propuesta de arquitectura; no implementa todavía un generador en el juego.  
**Objetivo:** añadir un modo interminable de Polar Shift que produzca niveles variados y ajuste su dificultad al dominio real del jugador, sin exigir conexión ni una llamada a IA para poder jugar.

## 1. Conclusión ejecutiva

La idea es viable, pero no recomiendo que un modelo de lenguaje dibuje toda la geometría desde cero cada vez que termina un nivel. Para Polar Shift funcionaría mejor un sistema híbrido:

1. Un generador procedural determinista construye la geometría y garantiza que el nivel se pueda validar sin conexión.
2. Un director de dificultad estima qué mecánicas domina el jugador y selecciona la siguiente combinación de retos.
3. Una IA generativa opcional propone planos de nivel, combinaciones de segmentos, objetivos o variaciones temáticas. Sus propuestas pasan por el mismo validador que los niveles procedurales.
4. Si no hay red, el modelo falla o produce un diseño inválido, el juego genera un nivel procedural seguro con la misma semilla.

Así se puede crear una secuencia prácticamente ilimitada de niveles reproducibles, sin convertir la API de IA en una dependencia de la partida.

La campaña actual de seis niveles debe mantenerse como campaña diseñada a mano. El generador se incorporaría como un modo separado, por ejemplo **Supervivencia Infinita** o **Cuaderno Infinito**. Los seis niveles existentes seguirían enseñando las mecánicas en un orden controlado.

## 2. Diagnóstico del proyecto actual

La propuesta se basa en la estructura que existe hoy en el repositorio:

- `src/game/levels.ts` contiene seis niveles fijos en `LEVELS`.
- `LevelData` en `src/game/types.ts` ya define una representación común: dimensiones del mundo, aparición, meta, plataformas, púas, gomas, gotas y estrellas.
- `loadLevel` en `src/App.tsx` selecciona un índice de `LEVELS`, clona el objeto y reinicia el estado de la partida.
- `nextLevel` avanza mientras queden elementos en `LEVELS`; al terminar el sexto nivel vuelve a la pantalla de título.
- El sistema de puntuaciones está asociado al índice del nivel. Un modo infinito necesitará identificar cada partida por semilla y registrar récords independientes.
- `package.json` ya declara `@google/genai`, `express` y `dotenv`, pero sus scripts de ejecución actuales son de Vite. La presencia de esas dependencias no demuestra que exista un servicio de generación seguro desplegado.

La forma de datos `LevelData` es un buen punto de integración: el generador debería entregar objetos compatibles con ese contrato para reutilizar el motor, el renderizador, la economía de tinta y las reglas físicas.

## 3. Arquitectura recomendada

### A. Perfil de habilidad del jugador

El juego debe estimar habilidades por separado, no tratar todas las muertes o victorias como una única puntuación. Propongo un perfil con cuatro ejes:

| Eje | Qué mide | Variables que habría que registrar |
|---|---|---|
| Movimiento y salto | Precisión al correr, saltar y aterrizar | Caídas, intentos, tiempo para superar huecos, saltos fallidos |
| Lectura de realidades | Capacidad para interpretar WHITE / BLACK | Muertes por peligros de fase, cambios de realidad y errores de lectura |
| Dibujo y economía | Capacidad para resolver huecos con trazos | Tinta consumida, cantidad y longitud de puentes, trazos borrados |
| Anticipación | Lectura de amenazas temporizadas o móviles | Muertes por goma/gotas, tiempo de espera y cruces fallidos |

Parte de la información ya existe (tiempo, estrellas y cambios de fase), pero el registro de muertes por causa, intentos y uso detallado de tinta tendría que añadirse. Conviene mantener perfiles separados para Contraste y Espejo, porque sus reglas y habilidades no son equivalentes.

El perfil se puede guardar localmente. No es necesario enviar el historial de juego a un proveedor de IA.

### B. Director de dificultad adaptativa

Este componente decide qué tipo de reto conviene presentar a continuación. No dibuja objetos: elige parámetros y segmentos.

Ejemplos de variables ajustables:

- Distancia horizontal y diferencia vertical entre plataformas.
- Tiempo de reacción antes de que una amenaza móvil cruce una zona.
- Densidad, ubicación y combinación de peligros.
- Número de mecánicas que se combinan en un mismo tramo.
- Cantidad de rutas seguras, estrellas opcionales y puentes necesarios.
- Presión de la economía de tinta, dentro de límites que nunca hagan imposible el nivel.

La dificultad debe reaccionar a tendencias de varios intentos, no a una sola muerte. Si el jugador domina una mecánica, el director puede aumentar gradualmente su complejidad; si encadena fracasos, debe ofrecer un tramo de recuperación o reducir una sola variable. No debería cambiar las reglas fundamentales ni crear una dificultad que parezca arbitraria.

### C. Generador procedural basado en segmentos

En lugar de construir cada nivel como una lista aleatoria de objetos, recomiendo componerlo con segmentos diseñados y parametrizados:

1. **Entrada segura:** permite entender el terreno que viene.
2. **Enseñanza o recordatorio:** presenta una mecánica o una variante.
3. **Desafío principal:** combina una o dos habilidades.
4. **Recuperación:** ofrece un tramo con menor presión.
5. **Recompensa y salida:** permite recoger estrellas y llegar a la meta.

Cada segmento debe tener puntos de entrada y salida, altura, ancho, rango de dificultad, mecánicas requeridas y restricciones por modo. La composición produce una ruta continua; luego se genera el `LevelData` final con identificadores deterministas derivados de la semilla.

Cada nivel debe tener una **semilla** y una versión del generador. Con la misma semilla y versión debe poder reconstruirse exactamente el mismo nivel. Esto permite guardar partidas, compartir códigos de nivel, reproducir errores y comparar pruebas.

### D. IA como diseñadora de planos, no como motor de física

La IA puede aportar variedad semántica y combinatoria: proponer una secuencia de segmentos, una variante de obstáculo, una meta opcional o un tema visual. No debe decidir directamente colisiones, ejecutar código generado ni tener autoridad para saltarse reglas.

El formato de respuesta recomendado es un esquema JSON limitado, por ejemplo:

- modo: Contraste o Espejo;
- arquetipo: salto, lectura de fase, puente, amenaza móvil o combinación;
- segmentos en orden;
- dificultad objetivo por eje;
- parámetros dentro de rangos permitidos;
- ubicación aproximada de recompensa y meta.

El generador procedural transforma ese plano en coordenadas y objetos concretos. La salida de IA nunca se inserta directamente en el motor.

La API de Gemini admite salidas estructuradas con esquemas JSON y el SDK oficial para JavaScript/TypeScript es `@google/genai`. Sin embargo, que una respuesta tenga JSON válido no demuestra que el nivel sea jugable: la documentación de Google recomienda validar también la semántica y manejar errores. Fuentes:
- [Salidas estructuradas de Gemini](https://ai.google.dev/gemini-api/docs/structured-output)
- [SDK oficial de Gemini](https://ai.google.dev/gemini-api/docs/libraries)

## 4. Validación obligatoria antes de cargar un nivel

Ningún nivel generado debe entrar directamente a la partida. Propongo una cadena de validación:

1. **Esquema:** comprobar tipos, campos obligatorios, límites y cantidades máximas.
2. **Geometría:** comprobar que los objetos estén dentro del mundo, que los identificadores sean únicos y que spawn/meta sean válidos.
3. **Seguridad:** impedir que spawn aparezca dentro de una plataforma, púa, goma o gota activa; impedir que las estrellas se superpongan a hitboxes letales.
4. **Alcanzabilidad:** comprobar que exista una ruta desde spawn hasta meta con el movimiento, doble salto y economía de tinta reales del juego. Para la primera versión se puede usar una búsqueda de secuencias discretas de movimiento/salto sobre la simulación; no basta con medir distancias entre plataformas.
5. **Reglas de Contraste:** validar cambios WHITE/BLACK, colisiones de fase y que SHIFT no coloque al jugador dentro de geometría letal.
6. **Reglas de Espejo:** validar la ruta física compartida, la unión de peligros de ambas realidades, que solo las plataformas BOTH bloqueen y que los puentes proyectados desde cada panel puedan resolver los huecos correspondientes.
7. **Prueba de regresión:** ejecutar el nivel con semillas de prueba y varios perfiles de dificultad.

Si falla una validación, el sistema puede pedir una reparación limitada, probar otra composición o usar un segmento de respaldo. Nunca debe mostrar un nivel que no haya pasado las comprobaciones.

## 5. Dónde entra la IA en la ejecución real

**No llamar al modelo cada vez que el jugador se mueve ni en cada fotograma.** Eso añadiría latencia, coste y dependencia de red a una mecánica que debe responder inmediatamente.

Flujo recomendado:

1. El jugador termina un nivel.
2. El director local actualiza su perfil y decide el rango de dificultad siguiente.
3. El generador local compone el siguiente nivel desde segmentos validados.
4. Opcionalmente, un servicio remoto solicita a Gemini un plano de variación para niveles futuros; lo valida y lo guarda en caché.
5. La partida carga el siguiente nivel de la caché o el nivel procedural local.

Para publicar en itch.io como juego HTML5, la experiencia principal debe seguir funcionando completamente en el navegador sin backend. La generación procedural se ejecuta localmente; la parte de IA remota es opcional. Si se utiliza Gemini en producción, la clave debe permanecer en un backend o función segura: Google advierte expresamente que no se debe exponer en aplicaciones de navegador o código cliente. Fuente: [Seguridad de claves de Gemini](https://ai.google.dev/gemini-api/docs/api-key).

Los niveles remotos deben almacenarse en caché y tener una alternativa offline. La disponibilidad de modelos, límites y precios puede cambiar; hay que verificar la tabla vigente antes de habilitar llamadas para jugadores. Fuente: [Precios de Gemini API](https://ai.google.dev/gemini-api/docs/pricing).

## 6. Riesgos y controles

| Riesgo | Consecuencia | Control |
|---|---|---|
| Nivel imposible o injusto | Frustración y abandono | Validador de ruta y simulación con la física real |
| Repetición de patrones | El modo infinito se vuelve predecible | Catálogo de segmentos, memoria de los últimos niveles y restricciones de repetición |
| Dificultad que oscila demasiado | El jugador siente que el juego lo castiga | Ajustes graduales, histéresis y límites por nivel |
| Respuesta de IA mal formada o incoherente | Nivel corrupto | Esquema, validación semántica y fallback procedural |
| Falta de internet o cuota agotada | No se puede generar el siguiente nivel | Generación local determinista y caché |
| Filtración de clave API | Uso no autorizado y costes | Llamadas desde backend, nunca desde el bundle del navegador |
| Semillas/versiones incompatibles | Una repetición deja de coincidir | Guardar semilla, versión del generador y versión de reglas |

La investigación académica sobre generación procedural distingue enfoques algorítmicos, búsqueda, aprendizaje automático y modelos de lenguaje; también destaca la utilidad de los enfoques combinados. La adaptación dinámica de dificultad y la personalización cuentan con una literatura previa amplia, por lo que no conviene reducir el problema a pedirle a un LLM que invente niveles. Referencias:
- Farrokhi Maleki y Zhao, *Procedural Content Generation in Games: A Survey with Insights on Emerging LLM Integration* (AAAI AIIDE, 2024): [DOI 10.1609/aiide.v20i1.31877](https://doi.org/10.1609/aiide.v20i1.31877).
- Paraschos y Koulouriotis, *Game Difficulty Adaptation and Experience Personalization: A Literature Review* (International Journal of Human–Computer Interaction): [DOI 10.1080/10447318.2021.2020008](https://doi.org/10.1080/10447318.2021.2020008).

## 7. Plan de implementación por etapas

### Etapa 1 — Preparar el modelo de niveles
- Separar campaña fija y niveles generados.
- Definir `GeneratedLevel`, semilla y versión de generador.
- Crear validador de geometría, seguridad y reglas por modo.
- Añadir pruebas automatizadas con cientos de semillas.

### Etapa 2 — Modo infinito procedural
- Crear catálogo de segmentos y sus conectores.
- Crear generador determinista y director de composición.
- Integrar una secuencia interminable que no dependa de la API.
- Guardar semilla, récord y progreso por modo.

### Etapa 3 — Perfil adaptativo
- Registrar eventos de partida sin afectar el rendimiento del bucle de 60 FPS.
- Calcular habilidades separadas para movimiento, lectura, dibujo y anticipación.
- Ajustar gradualmente los parámetros y medir si mejora la tasa de finalización sin perder reto.

### Etapa 4 — IA opcional
- Crear una interfaz de proveedor independiente de Gemini.
- Implementar un endpoint seguro que genere planos JSON estructurados.
- Validar, almacenar en caché y rechazar propuestas inválidas.
- Probar con jugadores y comparar variedad, dificultad y tasa de niveles aceptados frente al generador procedural puro.

### Etapa 5 — Balance y lanzamiento
- Medir variedad real, repeticiones, tasa de éxito y tiempo de generación.
- Mantener la campaña original y el modo infinito como experiencias distintas.
- Publicar el generador con modo offline garantizado.

## 8. Recomendación final

**Aprobaría la investigación y prototiparía primero el generador procedural con adaptación local.** No conectaría todavía Gemini al juego ni haría que el modelo genere coordenadas de plataformas directamente.

La primera meta técnica debe ser: producir 100–500 niveles de prueba con semillas reproducibles, validar todos automáticamente y comprobar que existen rutas completables tanto en Contraste como en Espejo. Cuando eso funcione, la IA puede aportar variedad a los planos y segmentos sin poner en riesgo la jugabilidad.

El modo infinito sería así una fuente de rejugabilidad y aprendizaje personalizado; no un sustituto de los seis niveles que enseñan las reglas fundamentales de Polar Shift.
