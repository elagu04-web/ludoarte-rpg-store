export interface SpinSheet {
  path: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
}

export interface BoardGame {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Units currently in stock. 0 means "not in stock, order-only". */
  stock: number;
  /** Optional 360-degree box-rotation sprite sheet (columns x rows frames). */
  spinSheet?: SpinSheet;
  /** Short one-line description of what the game is about. */
  description?: string;
  /** Player count, e.g. "2 a 4". */
  players?: string;
  /** Recommended minimum age, e.g. "8+". */
  age?: string;
  /** Typical playtime, e.g. "30 a 45 min". */
  duration?: string;
  /** Optional YouTube link (reglas, unboxing, etc.) shown via "Ver video". */
  videoUrl?: string;
}

export interface ShelfData {
  id: string;
  title: string;
  games: BoardGame[];
}

export const PLACEHOLDER_IMAGE = "/assets/placeholder-game.svg";

// Catalogo real de Ludoarte, cargado desde la planilla de inventario
// (precio = "Precio de Venta Publico", stock = suma de "Cantidad en Stock"
// entre lotes repetidos). Repartido parejo en las 3 estanterias por ahora;
// la categoria por tematica se ajusta despues.
export const shelves: ShelfData[] = [
  {
    id: "shelf-strategy",
    title: "Estanteria de Estrategia",
    games: [
      { id: "papas-queman", name: "Papas queman", price: 1250, stock: 2, image: "/assets/boardgames/papas-queman.png" },
      { id: "salem-1692", name: "Salem 1692", price: 1790, stock: 0, image: "/assets/boardgames/salem.png" },
      { id: "llamagedon", name: "LLamagedon", price: 1250, stock: 1, image: "/assets/boardgames/llamagedon.png" },
      { id: "no-game-over", name: "No Game Over", price: 1390, stock: 1, image: "/assets/boardgames/no-game-over.png" },
      { id: "yokai-pagoda", name: "Yokai Pagoda", price: 1390, stock: 2, image: "/assets/boardgames/yokai-pagoda.png" },
      {
        id: "exploding-kittens",
        name: "Exploding Kittens",
        price: 1890,
        stock: 1,
        image: "/assets/boardgames/exploding-kittens.png",
        description: "Juego de cartas rapido y con humor negro: evita explotar.",
        players: "2 a 5",
        age: "7+",
        duration: "15 min",
      },
      { id: "niji", name: "Niji", price: 1250, stock: 1, image: "/assets/boardgames/niji.png" },
      { id: "dados-pato-mar", name: "Dados Pato Mar", price: 890, stock: 1, image: "/assets/boardgames/dados-pato-mar.png" },
      { id: "terraforming-mars", name: "Terraforming Mars", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "pandemia", name: "Pandemia!", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "katamino", name: "Katamino", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "domino-6", name: "Dominó 6", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "kites", name: "Kites", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "faraway", name: "Faraway", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
    ],
  },
  {
    id: "shelf-party",
    title: "Estanteria de Fiesta",
    games: [
      { id: "rin-rin-raja", name: "Rin Rin Raja", price: 1190, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "flores", name: "Flores", price: 1550, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "difference", name: "Difference", price: 1490, stock: 1, image: PLACEHOLDER_IMAGE },
      {
        id: "lama",
        name: "Lama",
        price: 1350,
        stock: 1,
        image: PLACEHOLDER_IMAGE,
        description: "Juego de cartas rapido: el objetivo es sumar la menor cantidad de puntos.",
        players: "2 a 6",
        age: "8+",
        duration: "15 a 30 min",
      },
      { id: "la-noche-de-gansferatu", name: "La Noche de Gansferatu", price: 990, stock: 1, image: PLACEHOLDER_IMAGE },
      {
        id: "cubirds",
        name: "Cubirds",
        price: 1350,
        stock: 1,
        image: PLACEHOLDER_IMAGE,
        description: "Juego de cartas de coleccionar parejas de pajaros.",
        players: "2 a 4",
        age: "8+",
        duration: "30 min",
      },
      { id: "district-noir", name: "District Noir", price: 1390, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "palabras-basura", name: "Palabras Basura", price: 1690, stock: 0, image: PLACEHOLDER_IMAGE },
      { id: "hombres-lobo", name: "Hombres Lobo", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "secret-hitler", name: "Secret Hitler", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "taco-cat-goat-cheese-pizza", name: "Taco Cat Goat Cheese Pizza", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "polilla-tramposa", name: "Polilla Tramposa", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "saboteur", name: "Saboteur", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "el-rebano", name: "El Rebaño", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
    ],
  },
  {
    id: "shelf-family",
    title: "Estanteria Familiar",
    games: [
      { id: "patachof", name: "Patachof", price: 1350, stock: 1, image: "/assets/boardgames/patachof.png" },
      { id: "vaalbara", name: "Vaalbara", price: 1700, stock: 1, image: "/assets/boardgames/vaalbara.png" },
      {
        id: "tummple",
        name: "Tummple",
        price: 1900,
        stock: 1,
        image: "/assets/boardgames/tummple.png",
        description: "Juego de apilar piezas de madera en 3D sin que se caigan.",
        players: "2 a 4",
        age: "8+",
        duration: "20 min",
      },
      { id: "barrio", name: "Barrio", price: 1290, stock: 0, image: PLACEHOLDER_IMAGE },
      {
        id: "catan",
        name: "Catan",
        price: 3690,
        stock: 1,
        image: "/assets/boardgames/catan-box.png",
        description: "Comercia y construye para colonizar una isla.",
        players: "3 a 4",
        age: "10+",
        duration: "60 a 120 min",
        videoUrl: "https://www.youtube.com/watch?v=5-6OVXTzVdI",
      },
      { id: "porto", name: "Porto", price: 2250, stock: 0, image: PLACEHOLDER_IMAGE },
      {
        id: "carcassonne",
        name: "Carcassonne",
        price: 3550,
        stock: 1,
        image: "/assets/boardgames/carcassonne.png",
        description: "Arma el mapa colocando losetas de ciudades, caminos y campos.",
        players: "2 a 5",
        age: "7+",
        duration: "30 a 45 min",
      },
      { id: "banana-azul", name: "Banana Azul", price: 1450, stock: 1, image: "/assets/boardgames/banana-azul.png" },
      {
        id: "azul",
        name: "Azul",
        price: 4200,
        stock: 1,
        image: "/assets/boardgames/azul.png",
        description: "Juego de estrategia con fichas de mosaico para decorar tu palacio.",
        players: "2 a 4",
        age: "8+",
        duration: "30 a 45 min",
      },
      { id: "ajedrez", name: "Ajedrez", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "burako", name: "Burako", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "flip-7", name: "Flip 7", price: 1500, stock: 1, image: PLACEHOLDER_IMAGE },
    ],
  },
];

/** Games with real box-art (not the generic placeholder) -- used e.g. to
 * pick a random "monster" box for the exterior mini-combat encounter. */
export const gamesWithArt: BoardGame[] = shelves
  .flatMap((shelf) => shelf.games)
  .filter((game) => game.image !== PLACEHOLDER_IMAGE);
