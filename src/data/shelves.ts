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
}

export interface ShelfData {
  id: string;
  title: string;
  games: BoardGame[];
}

const PLACEHOLDER_IMAGE = "/assets/placeholder-game.svg";

// Catalogo real de Ludoarte, cargado desde la planilla de inventario
// (precio = "Precio de Venta Publico", stock = suma de "Cantidad en Stock"
// entre lotes repetidos). Repartido parejo en las 3 estanterias por ahora;
// la categoria por tematica se ajusta despues.
export const shelves: ShelfData[] = [
  {
    id: "shelf-strategy",
    title: "Estanteria de Estrategia",
    games: [
      { id: "papas-queman", name: "Papas queman", price: 1250, stock: 2, image: PLACEHOLDER_IMAGE },
      { id: "salem-1692", name: "Salem 1692", price: 1790, stock: 0, image: PLACEHOLDER_IMAGE },
      { id: "llamagedon", name: "LLamagedon", price: 1250, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "no-game-over", name: "No Game Over", price: 1390, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "yokai-pagoda", name: "Yokai Pagoda", price: 1390, stock: 2, image: PLACEHOLDER_IMAGE },
      { id: "exploding-kittens", name: "Exploding Kittens", price: 1890, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "niji", name: "Niji", price: 1250, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "dados-pato-mar", name: "Dados Pato Mar", price: 890, stock: 1, image: PLACEHOLDER_IMAGE },
    ],
  },
  {
    id: "shelf-party",
    title: "Estanteria de Fiesta",
    games: [
      { id: "rin-rin-raja", name: "Rin Rin Raja", price: 1190, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "flores", name: "Flores", price: 1550, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "difference", name: "Difference", price: 1490, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "lama", name: "Lama", price: 1350, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "la-noche-de-gansferatu", name: "La Noche de Gansferatu", price: 990, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "cubirds", name: "Cubirds", price: 1350, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "district-noir", name: "District Noir", price: 1390, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "palabras-basura", name: "Palabras Basura", price: 1690, stock: 0, image: PLACEHOLDER_IMAGE },
    ],
  },
  {
    id: "shelf-family",
    title: "Estanteria Familiar",
    games: [
      { id: "patachof", name: "Patachof", price: 1350, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "vaalbara", name: "Vaalbara", price: 1700, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "tummple", name: "Tummple", price: 1900, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "barrio", name: "Barrio", price: 1290, stock: 0, image: PLACEHOLDER_IMAGE },
      {
        id: "catan",
        name: "Catan",
        price: 3690,
        stock: 1,
        image: "/assets/boardgames/catan-box.png",
      },
      { id: "porto", name: "Porto", price: 2250, stock: 0, image: PLACEHOLDER_IMAGE },
      { id: "carcassonne", name: "Carcassonne", price: 3550, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "banana-azul", name: "Banana Azul", price: 1450, stock: 1, image: PLACEHOLDER_IMAGE },
      { id: "azul", name: "Azul", price: 4200, stock: 1, image: PLACEHOLDER_IMAGE },
    ],
  },
];
