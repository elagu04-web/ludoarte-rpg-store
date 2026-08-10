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

- **Separar alquiler en el local de alquiler a domicilio**: en marcha,
  ya hecho el primer paso:
  - [x] Boton de pedido por WhatsApp en el Alquiler existente (ahora
    "Alquiler en el Local" -- RentalMenu.tsx).
  - [x] Mesa nueva "Alquiler a Domicilio" en GroundFloorScene.ts,
    (560, 1145) (antes vacia, en espejo con la de Alquiler en 560,535)
    -- DeliveryRentalMenu.tsx + DeliveryRentalPrompt.tsx, mismo
    catalogo de rentalGames por ahora, mensaje de WhatsApp pidiendo
    direccion en vez de "retiro en el local".

  Pendiente:
  - **Filtrar por modalidad**: no todos los titulos van a estar
    disponibles en las dos modalidades -- hace falta poder marcar, por
    juego, si aplica a local, a domicilio, o a ambos. Como
    rentalGames (data/rentals.ts) es una lista fija en el codigo (NO
    esta conectada al sistema de banderas for_sale/for_rental del
    panel de Inventario), esto hoy se resolveria agregando dos
    columnas al RentalGame de cada juego y editando el codigo -- el
    admin todavia no podria autogestionarlo desde Inventario como con
    venta/segunda mano. Evaluar si vale la pena unificar los sistemas
    mas adelante.
  - **Paquetes**, de dos tipos:
    - **"Packs Ludoarte"**: combos fijos armados por el admin (ej:
      "Pack Familiar: 3 juegos por $500"), el cliente elige entre los
      combos ya armados.
    - **"Armá tu Pack"**: el cliente elige el mismo cualquier N
      juegos de la lista de alquiler a domicilio y el sistema calcula
      el precio del paquete. Mas complejo de programar y mantener que
      los packs fijos.
    - Variante de "Armá tu Pack": en vez de (o ademas de) elegir
      juegos puntuales, el cliente ingresa un **presupuesto** y el
      sistema arma/sugiere una combinacion de juegos de la lista de
      alquiler a domicilio que entre en ese monto.

- **Agregar personajes**: hoy "Elegir Personaje" (CharacterSelectScreen)
  solo aplica un tinte de color sobre el mismo sprite
  (player-walk-sheet.png) -- no son personajes distintos, son
  variantes de color del mismo muñeco. La idea es sumar personajes de
  verdad, con arte/sprites propios para elegir, no solo mas colores.
