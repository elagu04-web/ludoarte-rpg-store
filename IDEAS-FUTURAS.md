# Ideas futuras para Ludoarte RPG Store

Lista de cosas que se nos fueron ocurriendo pero decidimos dejar para
mas adelante, para no hacer todo junto. Cuando quieras retomar
alguna, avisame.

- **Seguimiento de que juegos mira cada jugador y cuanto tiempo** (en
  Modo Tienda): registrar, para cada juego que alguien ve, cuanto
  tiempo estuvo mirandolo y si lo vio en el contexto de compra o de
  alquiler. Sirve para el panel admin, para saber que le interesa a
  cada uno y poder mandarle promociones puntuales. Pendiente definir
  cuanto tiempo minimo cuenta como "mirar" un juego.

- **Deteccion automatica de fotos nuevas sin juego asociado**: si se
  suelta un archivo de imagen en public/assets/boardgames/ que no
  corresponde a ningun juego conocido (ni del codigo ni de
  custom_games), detectarlo y ofrecer crear el juego a partir de esa
  foto directamente. Necesitaria una API route que liste el
  contenido de la carpeta (fs.readdir) y lo compare contra los ids
  conocidos.

- **Mejorar las entradas y salidas a los lugares**: revisar la
  transicion entre escenas (puertas, escalera, zonas de entrada/
  salida) para que se sientan mejor. Falta que el usuario aclare
  puntualmente que no le gusta de como esta ahora.

- **Cruzarse con otros usuarios / jugar online**: poder jugar Ajedrez
  (y tal vez otros juegos) contra gente de verdad dentro del juego. Es
  posible, pero es el item mas grande de toda esta lista -- bastante
  mas trabajo que cualquier cosa hecha hasta ahora. Dos caminos:
  - **Lichess**: confirmado (probando los headers reales del sitio)
    que Lichess NO se puede mostrar incrustado adentro de la pantalla
    del juego -- el sitio se protege explicitamente contra eso
    (`X-Frame-Options: DENY`). Lo que si funciona, y es practicamente
    gratis de implementar, es abrir Lichess en una **pestaña nueva del
    navegador** desde la mesa de ajedrez (un link comun) -- se sale
    del pixel-art un momento, pero es real, anonimo, y no requiere
    nada de backend propio. Idea no descartada, solo pausada por
    ahora.
  - **Tablero propio + Supabase Realtime** (ya usamos Supabase para
    todo lo demas): mantiene el estilo visual, pero hay que construir
    reglas de ajedrez (libreria tipo chess.js), sincronizar turnos en
    vivo y armar algun tipo de sala/emparejamiento -- varios dias de
    trabajo.

  Recomendacion para cuando se retome: no arrancar directo por
  "emparejar con desconocidos" (necesita gente conectada al mismo
  tiempo, cola de espera, etc.). Mejor una primera version mas chica:
  "retar a un amigo por link" -- se genera un codigo/link de partida,
  el amigo lo abre y juegan los dos ahi. Mismo tablero y reglas, pero
  sin necesitar resolver el problema de "encontrar rival" todavia.

- **Separar alquiler en el local de alquiler a domicilio**: hoy el
  menu de Alquiler (RentalMenu.tsx) es solo informativo -- no tiene
  ni siquiera un boton para pedirlo todavia, a diferencia de Comprar y
  Segunda Mano que ya abren WhatsApp. Ese es el primer paso pendiente
  antes de esto. La idea, ya charlada:
  - Dos modalidades separadas: **alquiler en el local** (retiro en
    persona) y **alquiler a domicilio** (entrega). No todos los
    titulos van a estar disponibles en las dos modalidades -- hace
    falta poder marcar, por juego, si aplica a local, a domicilio, o a
    ambos (probablemente dos columnas mas en game_overrides/
    custom_games, similar a como ya existen for_sale/for_rental).
  - Ademas de alquilar titulos sueltos, va a haber **paquetes**, de
    dos tipos:
    - **"Packs Ludoarte"**: combos fijos armados por el admin (ej:
      "Pack Familiar: 3 juegos por $500"), el cliente elige entre los
      combos ya armados.
    - **"Armá tu Pack"**: el cliente elige el mismo cualquier N
      juegos de la lista de alquiler a domicilio y el sistema calcula
      el precio del paquete. Mas complejo de programar y mantener que
      los packs fijos.
  - Para el pedido en si (una vez elegido local/domicilio y title(s)
    o pack), seguir el mismo patron que ya usa todo el resto del
    sitio: armar el mensaje de WhatsApp con el detalle (modalidad,
    juegos, direccion si es domicilio) en vez de programar un sistema
    de pedidos propio -- no hace falta manejar zonas de entrega ni
    precios de envio en el sistema todavia, eso lo cotiza el local por
    WhatsApp.
