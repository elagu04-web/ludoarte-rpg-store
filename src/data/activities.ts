// Info de las mesas de actividades del piso de abajo (GroundFloorScene) --
// todo lo que no sea la mesa de Alquiler, que ya tiene su propio sistema
// (RentalMenu). Cada una se muestra en ActivityInfoScreen cuando el
// jugador se para en su mesa y aprieta E.

export interface ActivityGroup {
  label: string;
  schedule: string;
}

export interface Activity {
  id: string;
  title: string;
  groups: ActivityGroup[];
  note?: string;
  priceLines: string[];
  cta: "Inscribirse" | "Consultar";
}

export const activities: Activity[] = [
  {
    id: "ajedrez",
    title: "Ajedrez",
    groups: [
      { label: "Niñ@s y adolescentes", schedule: "Miercoles 17:30 y Martes 17:15" },
      { label: "Adultos", schedule: "Martes y Jueves 18:30" },
    ],
    priceLines: ["Consultar precio"],
    cta: "Consultar",
  },
  {
    id: "arte",
    title: "Arte",
    groups: [
      { label: "Niñ@s y adolescentes", schedule: "Viernes 17:15 y Sabado 11:30" },
    ],
    priceLines: ["$1300 mensual"],
    cta: "Inscribirse",
  },
  {
    id: "arcilla",
    title: "Arcilla",
    groups: [
      { label: "Niñ@s y adolescentes", schedule: "Jueves 17:15 y Sabados 10:00" },
    ],
    priceLines: ["Consultar precio"],
    cta: "Consultar",
  },
  {
    id: "eventos",
    title: "Eventos",
    groups: [{ label: "Torneo de ajedrez", schedule: "Todos los martes 18:30" }],
    note: "Vamos a ir agregando mas actividades con el tiempo.",
    priceLines: [],
    cta: "Consultar",
  },
  {
    id: "club-del-puzzle",
    title: "Club del Puzzle",
    groups: [],
    note: "Proximamente mas informacion.",
    priceLines: [],
    cta: "Consultar",
  },
  {
    id: "membresia",
    title: "Membresia",
    groups: [],
    priceLines: [
      "Por dia: $250",
      "Mensual (una vez por semana): $750",
      "Total mensual: $1050",
    ],
    cta: "Inscribirse",
  },
];

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id);
}
