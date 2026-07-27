export interface BoardGame {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface ShelfData {
  id: string;
  title: string;
  games: BoardGame[];
}

const PLACEHOLDER_IMAGE = "/assets/placeholder-game.svg";

export const shelves: ShelfData[] = [
  {
    id: "shelf-strategy",
    title: "Estanteria de Estrategia",
    games: [
      { id: "catan", name: "Catan", price: 2500, image: PLACEHOLDER_IMAGE },
      {
        id: "carcassonne",
        name: "Carcassonne",
        price: 2200,
        image: PLACEHOLDER_IMAGE,
      },
      {
        id: "ticket-to-ride",
        name: "Ticket to Ride",
        price: 2800,
        image: PLACEHOLDER_IMAGE,
      },
    ],
  },
  {
    id: "shelf-party",
    title: "Estanteria de Fiesta",
    games: [
      {
        id: "codenames",
        name: "Codenames",
        price: 1800,
        image: PLACEHOLDER_IMAGE,
      },
      { id: "dixit", name: "Dixit", price: 2600, image: PLACEHOLDER_IMAGE },
    ],
  },
  {
    id: "shelf-family",
    title: "Estanteria Familiar",
    games: [
      { id: "uno", name: "Uno", price: 900, image: PLACEHOLDER_IMAGE },
      { id: "jenga", name: "Jenga", price: 1500, image: PLACEHOLDER_IMAGE },
      {
        id: "rummikub",
        name: "Rummikub",
        price: 2100,
        image: PLACEHOLDER_IMAGE,
      },
    ],
  },
];
