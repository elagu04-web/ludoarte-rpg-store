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

- **Al agregar un juego nuevo desde Inventario, elegir venta/alquiler**:
  hoy "+ Agregar juego" siempre lo crea como solo-venta (forSale:
  true, forRental: false, ver data/customGames.ts). Agregar la
  posibilidad de marcarlo tambien (o solo) para alquiler.

- **Precio en pasos de 10 en vez de 50/500**: en InventoryScreen.tsx,
  PRICE_STEP (50, boton con el mouse) y PRICE_STEP_FAST (500,
  SHIFT+A/D) -- cambiar el paso normal a 10 para ajustar mas fino.

- **Poder entrar a cada mesa a ver que hay**: de las 8 mesas del piso
  de abajo (GroundFloorScene.ts) solo la de Alquiler es interactiva
  hoy. Falta definir que muestra cada una (Ajedrez, Arte, Arcilla,
  Eventos, Club del Puzzle, y las 2 sin cartel todavia) -- capaz un
  cartel con info, capaz un catalogo como el de alquiler.

- **Mejorar las entradas y salidas a los lugares**: revisar la
  transicion entre escenas (puertas, escalera, zonas de entrada/
  salida) para que se sientan mejor. Falta que el usuario aclare
  puntualmente que no le gusta de como esta ahora.
