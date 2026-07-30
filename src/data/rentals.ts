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

function rentalGame(name: string, price: number | null): RentalGame {
  const match = findSaleMatch(name);
  return {
    id: slugify(name),
    name,
    price,
    image: match?.image ?? PLACEHOLDER_IMAGE,
    spinSheet: match?.spinSheet,
    description: match?.description,
    players: match?.players,
    age: match?.age,
    duration: match?.duration,
  };
}

// Catalogo de alquiler, cargado desde la hoja "Alquiler" de la planilla
// "Ludoteca Ludoarte" (nombre + precio en UYU; el resto de columnas todavia
// no tiene datos cargados).
export const rentalGames: RentalGame[] = [
  rentalGame("Akropolis", 440),
  rentalGame("Avalon", 110),
  rentalGame("Aventureros al Tren", 220),
  rentalGame("Barrio", 110),
  rentalGame("Bohnanza", 110),
  rentalGame("Brass: Birmingham", 440),
  rentalGame("Brawl", 440),
  rentalGame("Camarero", 220),
  rentalGame("Can't Stop", 110),
  rentalGame("Carcassonne", 440),
  rentalGame("Catan", 440),
  rentalGame("Código Secreto", 220),
  rentalGame("Concordia", 440),
  rentalGame("Coral", 220),
  rentalGame("CuBirds", 110),
  rentalGame("Detectives Paranormales", 440),
  rentalGame("Dragones del Mar", 440),
  rentalGame("Señor de los Anillos: Duelo", 220),
  rentalGame("El Árbol de Aves", null),
  rentalGame("El Grande", 440),
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
