# Polar Shift — reglas oficiales de juego

> Documento rector de diseño. Si una descripción de interfaz, un nivel o una implementación contradice estas reglas, debe corregirse o registrarse como discrepancia; no se debe reinterpretar la mecánica sin una decisión de diseño.

## 1. Principio común

Polar Shift es un plataformas/puzzle de dos realidades, blanco y negro. El jugador lee información visual distinta en cada realidad y puede dibujar trazos que cambian de función al proyectarse en la realidad opuesta.

Los nombres `WHITE` y `BLACK` son identificadores técnicos de las realidades clara y oscura.

## 2. Modo Contraste

- Hay un único escenario compartido, una sola cámara y un personaje controlado.
- `SHIFT` alterna la fase activa entre WHITE y BLACK. El personaje cambia de color para conservar el contraste con el fondo.
- Un peligro WHITE es sólido y camuflado en WHITE; en BLACK es visible e intangible. Un peligro BLACK funciona a la inversa.
- Las plataformas pueden ser compartidas (`BOTH`) o exclusivas de una fase (`WHITE` / `BLACK`).
- Un cambio de fase se bloquea cuando la nueva fase colocaría al personaje dentro de una plataforma sólida o de un peligro letal.
- Un trazo es visible e intangible en la realidad donde se dibuja; en la realidad opuesta se vuelve invisible y sólido.
- En Contraste, el trazo conserva las mismas coordenadas al cambiar de fase: no se refleja horizontalmente.

## 3. Modo Espejo

- Se muestran dos vistas del mismo escenario: la vista derecha es un reflejo horizontal de la izquierda.
- Existe un único estado de movimiento controlado. El segundo personaje es el reflejo sincronizado, no un segundo jugador.
- Posición vertical, salto, caída, estado de suelo y muerte se sincronizan. La coordenada X y la velocidad horizontal del reflejo son las opuestas respecto al ancho del mundo.
- Hay peligros distintos en las dos realidades. Los peligros de ambas vistas se combinan en una sola ruta física: tocar una púa, goma o gota letal de cualquiera de las realidades mata al jugador y a su reflejo.
- Solo las plataformas `BOTH` pueden bloquear el movimiento compartido. Las plataformas o paredes exclusivas de WHITE o BLACK no pueden actuar como barreras en este modo, porque separarían las trayectorias.
- `SHIFT` cambia la realidad seleccionada desde la que se puede dibujar. No cambia el movimiento, no intercambia el control y no detiene al reflejo.
- Un trazo se refleja horizontalmente hacia la otra vista. Sigue siendo visible e intangible en su realidad de origen e invisible y sólido en la opuesta.
- Los coleccionables se comparten entre las dos vistas: recoger uno actualiza el estado común.

## 4. Reglas de diseño de niveles

1. No describir el modo Espejo como cooperación de dos personajes independientes.
2. No describir `SHIFT` como intercambio de personajes o de control.
3. En Espejo, no utilizar geometría exclusiva de fase como barrera física. Si se muestra con fines visuales, debe quedar claro que no bloquea la ruta compartida.
4. Los peligros de ambas realidades deben comunicar visualmente su ubicación sin convertir la vista opuesta en información engañosa.
5. Los trazos deben ser ayudas con un coste y un propósito; no deben convertir cada obstáculo en una solución trivial.
6. Los coleccionables no deben quedar superpuestos a hitboxes letales. Los peligros móviles que crucen su zona requieren pruebas de temporización y accesibilidad.
7. Cada nivel debe enseñar o combinar una habilidad identificable: lectura de fases, dibujo, salto, anticipación de peligros o dominio conjunto.

## 5. Criterios mínimos de validación

### Contraste
- Comprobar que un peligro de la fase activa mata y se camufla.
- Comprobar que el mismo peligro es visible e intangible en la fase opuesta.
- Comprobar que `SHIFT` se bloquea si la nueva fase solaparía al personaje con geometría o peligro sólido.
- Comprobar que los trazos no cambian de coordenadas.

### Espejo
- Comprobar que el reflejo permanece sincronizado en posición, salto, caída y muerte.
- Comprobar que la velocidad horizontal del reflejo es opuesta.
- Comprobar que las plataformas exclusivas no bloquean el recorrido compartido.
- Comprobar que los peligros de ambas realidades son letales.
- Comprobar que `SHIFT` cambia la realidad de dibujo, pero no el movimiento.
- Comprobar que un trazo hecho desde la vista derecha se proyecta horizontalmente hacia la ruta compartida.

### Calidad de nivel
- Ejecutar pruebas de integridad de datos y de solapamiento entre coleccionables y peligros.
- Jugar los seis niveles en ambos modos. Los tests automáticos no demuestran que el ritmo, la dificultad o las soluciones sean divertidos.
- Registrar cualquier prueba manual pendiente; no marcarla como realizada por el hecho de que CI esté verde.

## 6. Política de cambios

Las reglas anteriores representan el diseño acordado. Una tarea de IA debe citar la sección que afecta, explicar su solución y añadir pruebas cuando sea posible. Si el código actual contradice una regla, se documenta primero la discrepancia y se propone un cambio específico. No se cambia silenciosamente la regla para justificar la implementación.
