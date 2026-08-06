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
