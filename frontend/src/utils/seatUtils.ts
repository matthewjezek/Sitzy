// Pomocné funkce pro práci se sedadly

// Slovní popis pozice sedadla dle layoutu
export function getSeatPositionLabel(layout: string, position: number): string {
  const l = (layout || '').toLowerCase();
  switch (l) {
    case 'sedaq':
    case 'sedan (4 seats)':
      switch (position) {
        case 1: return 'levé přední';
        case 2: return 'pravé přední';
        case 3: return 'levé zadní';
        case 4: return 'pravé zadní';
        default: return `pozice ${position}`;
      }
    case 'trapaq':
    case 'coupé (2 seats)':
      switch (position) {
        case 1: return 'levé přední';
        case 2: return 'pravé přední';
        default: return `pozice ${position}`;
      }
    case 'praq':
    case 'minivan (7 seats)':
      switch (position) {
        case 1: return 'levé přední';
        case 2: return 'pravé přední';
        case 3: return 'střední levé';
        case 4: return 'střední prostřední';
        case 5: return 'střední pravé';
        case 6: return 'levé zadní';
        case 7: return 'pravé zadní';
        default: return `pozice ${position}`;
      }
    default:
      return `pozice ${position}`;
  }
}
