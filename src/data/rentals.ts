import { gamesWithArt, PLACEHOLDER_IMAGE, type SpinSheet } from "./shelves";

export interface RentalGame {
  id: string;
  name: string;
  /** Precio de alquiler en pesos uruguayos. null = todavia no cargado. */
  price: number | null;
  image: string;
  spinSheet?: SpinSheet;
  description?: string;
  players?: string;
  age?: string;
  duration?: string;
}

// Unicode escapes (not literal combining-mark characters) to avoid an
// encoding round-trip issue that mangled this file when the raw diacritic
// range was typed directly.
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

function normalize(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "").trim();
}

function slugify(name: string): string {
  return normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Si ya tenemos la caja real (y ficha) de este juego en el catalogo de
// venta (misma planilla, otra hoja), la reutilizamos aca en vez de pedir
// una caja nueva o escribir la descripcion de nuevo.
function findSaleMatch(name: string) {
  const target = normalize(name);
  return gamesWithArt.find((game) => normalize(game.name) === target);
}

interface RentalInfo {
  description?: string;
  players?: string;
  age?: string;
  duration?: string;
  /** Caja real para juegos que solo se alquilan (no estan en el catalogo
   * de venta, asi que no hay de donde heredarla). */
  image?: string;
}

// Los juegos que tambien estan a la venta heredan su ficha (descripcion,
// jugadores, edad, duracion, caja) del catalogo de venta -- esa es la
// fuente unica de verdad para esos. Los que solo se alquilan (no estan a
// la venta) llevan su propia ficha aca via el 3er parametro.
function rentalGame(
  name: string,
  price: number | null,
  info: RentalInfo = {}
): RentalGame {
  const match = findSaleMatch(name);
  return {
    id: slugify(name),
    name,
    price,
    image: match?.image ?? info.image ?? PLACEHOLDER_IMAGE,
    spinSheet: match?.spinSheet,
    description: match?.description ?? info.description,
    players: match?.players ?? info.players,
    age: match?.age ?? info.age,
    duration: match?.duration ?? info.duration,
  };
}

// Catalogo de alquiler, cargado desde la hoja "Alquiler" de la planilla
// "Ludoteca Ludoarte" (nombre + precio en UYU; el resto de columnas todavia
// no tiene datos cargados).
export const rentalGames: RentalGame[] = [
  rentalGame("Akropolis", 440, {
    description: "Construi tu ciudad griega en varios niveles, encastrando barrios para conseguir la mejor puntuacion.",
    players: "1 a 4",
    age: "8+",
    duration: "20 a 30 min",
    image: "/assets/boardgames/akropolis.png",
  }),
  rentalGame("Avalon", 110, {
    description: "Deduccion social en el reino del Rey Arturo: leales a Arturo contra secuaces de Mordred, sin saber quien es quien.",
    players: "5 a 10",
    age: "12+",
    duration: "30 min",
  }),
  rentalGame("Aventureros al Tren", 220, {
    description: "Junta cartas de vagones para construir tus rutas de tren por el mapa y cumplir tus billetes de destino.",
    players: "2 a 5",
    age: "8+",
    duration: "30 a 60 min",
  }),
  rentalGame("Barrio", 110),
  rentalGame("Bohnanza", 110, {
    description: "Cultiva y comercia porotos con los demas jugadores para juntar la mayor fortuna posible.",
    players: "2 a 7",
    age: "12+",
    duration: "45 min",
  }),
  rentalGame("Brass: Birmingham", 440, {
    description: "Juego de estrategia economica: desarrolla industrias y redes de transporte durante la revolucion industrial.",
    players: "2 a 4",
    age: "14+",
    duration: "60 a 120 min",
  }),
  rentalGame("Brawl", 440, {
    description: "Duelo rapido de cartas: bloquea, esquiva y golpea a tu rival hasta dejarlo sin vida.",
    players: "2",
    age: "13+",
    duration: "5 min",
  }),
  rentalGame("Camarero", 220, {
    description: "Unos son mozos y otros son clientes: hay que memorizar y entregar cada pedido sin equivocarse.",
    players: "2 a 10",
    age: "8+",
    duration: "30 min",
  }),
  rentalGame("Can't Stop", 110, {
    description: "Tira los dados y avanza en tres columnas, pero cuidado: podes perder todo lo ganado en el turno si segui arriesgando.",
    players: "2 a 4",
    age: "9+",
    duration: "30 min",
  }),
  rentalGame("Carcassonne", 440),
  rentalGame("Catan", 440),
  rentalGame("Código Secreto", 220, {
    description: "Da pistas de una sola palabra para que tu equipo adivine cuales tarjetas son sus agentes secretos, sin tocar al asesino.",
    players: "2 a 8",
    age: "10+",
    duration: "15 min",
  }),
  rentalGame("Concordia", 440, {
    description: "Comercia y expande tus rutas por el Imperio Romano para conseguir el favor de los dioses.",
    players: "2 a 5",
    age: "13+",
    duration: "100 min",
  }),
  rentalGame("Coral", 220, {
    description: "Hagan crecer un arrecife de coral entre todos, pero reservate los mejores lugares para vos.",
    players: "1 a 4",
    age: "8+",
    duration: "10 a 20 min",
  }),
  rentalGame("CuBirds", 110),
  rentalGame("Detectives Paranormales", 440, {
    description: "Un jugador es el fantasma de una victima; los demas son detectives que le hacen preguntas para descubrir como murio.",
    players: "2 a 6",
    age: "12+",
    duration: "30 a 50 min",
  }),
  rentalGame("Dragones del Mar", 440, {
    description: "Ubica a tus dragones para proteger los reinos submarinos del oro y los piratas, y consegui el mayor dominio de los mares.",
    players: "2 a 5",
    age: "8+",
    duration: "30 a 45 min",
  }),
  rentalGame("Señor de los Anillos: Duelo", 220, {
    description: "Duelo a dos: uno juega como Sauron y el otro como la Comunidad, compitiendo por el dominio de la Tierra Media.",
    players: "2",
    age: "10+",
    duration: "30 a 45 min",
  }),
  rentalGame("El Árbol de Aves", null, {
    description: "Atrae a las aves mas interesantes a tu reserva natural en este juego de coleccionar y hacer combos.",
    players: "1 a 5",
    age: "10+",
    duration: "40 a 70 min",
  }),
  rentalGame("El Grande", 440, {
    description: "Usa tus caballeros para controlar regiones de la España medieval, sin acercarte demasiado al Rey.",
    players: "2 a 5",
    age: "12+",
    duration: "60 a 120 min",
  }),
  rentalGame("Escape", null),
  rentalGame("Exploding Kittens", 110),
  rentalGame("Faraway", 220),
  rentalGame("Flip 7", 110),
  rentalGame("GLC: El Resurgir de la Comunidad del Anillo", 440),
  rentalGame("Heat", 440),
  rentalGame("Niji", 110),
  rentalGame("Kingdomino", 110),
  rentalGame("Las Torres Errantes", 220),
  rentalGame("Listo Imprenta", 220),
  rentalGame("Mi City", 440),
  rentalGame("Ra", 440),
  rentalGame("Números Drop", 110),
  rentalGame("Océanos de Papel", 110),
  rentalGame("Paper Dungeons", 220),
  rentalGame("Pax Viking", 440),
  rentalGame("Piko Piko", 110),
  rentalGame("Polilla Tramposa", 110),
  rentalGame("Porto", 440),
  rentalGame("Proyecto Arrecife", 440),
  rentalGame("Rhino Hero Super Battle", 220),
  rentalGame("Saboteur", 110),
  rentalGame("Secret Hitler", 440),
  rentalGame("Señor de los Anillos: La Comunidad del Anillo", 440),
  rentalGame("Sequence", 220),
  rentalGame("Shiki", 110),
  rentalGame("Splendor", 440),
  rentalGame("Sushi Go Party", 220),
  rentalGame("Taco Cat Goat Cheese Pizza", 110),
  rentalGame("Terra Nova", 440),
  rentalGame("Terraforming Mars", 440),
  rentalGame("T.E.G.", 110),
  rentalGame("Trio", 110),
  rentalGame("Vaalbara", 110),
  rentalGame("Valdés", 110),
  rentalGame("Yokai Pagoda", 110),
  rentalGame("Zero", 110),
];
