# SeatRenderer Komponenta

Komplexní React komponenta pro vykreslování a správu sedadel ve vozidlech
s realistickými SVG sedadly. Komponenta poskytuje interaktivní i informativní
režim zobrazení s podporou různých typů vozidel a overlay pozicování sedadel
přímo na obrázku vozidla.

## Vlastnosti

### ✨ Hlavní funkce

- **Realistická SVG sedadla** - používá detailní SVG obrázky místo abstraktních tvarů
- **CSS filtry pro stavy** - barevné rozlišení stavů pomocí CSS filtrů
bez ztráty detailů
- **Overlay pozicování** - sedadla jsou umístěna přímo na SVG vozidla jako overlay
- **Interaktivní výběr sedadel** - uživatelé mohou klikat na volná sedadla
- **Informativní zobrazení** - pro majitele vozidla bez možnosti interakce
- **Automatické označení řidiče** - pozice 1 je vždy rezervována pro majitele
- **Vizuální rozlišení stavů** - volné, vybrané, obsazené, řidič s CSS filtry
- **Responzivní design** - přizpůsobí se různým velikostem obrazovky
- **Přístupnost** - klávesnice, tooltips, ARIA podpory

### 🚗 Podporované typy vozidel

- **Sedan (4 místa)** - layout: `SEDAQ` nebo `Sedan (4 seats)`
- **Kupé (2 místa)** - layout: `TRAPAQ` nebo `Coupé (2 seats)`  
- **Minivan (7 míst)** - layout: `PRAQ` nebo `Minivan (7 seats)`

## API Reference

### Props

```typescript
interface SeatRendererProps {
  layout: 'SEDAQ' | 'TRAPAQ' | 'PRAQ' | string;
  seats: SeatData[];
  selectedSeat?: number | null;
  onSeatSelect?: (position: number | null) => void;
  ownerName?: string;
  mode: 'interactive' | 'display';
  className?: string;
}
```

#### Popis props

| Prop | Typ | Požadováno | Výchozí | Popis |
|------|-----|-----------|---------|-------|
| `layout` | `string` | ✅ | - | Typ vozidla (SEDAQ/TRAPAQ/PRAQ) |
| `seats` | `SeatData[]` | ✅ | - | Array s daty o sedadlech |
| `selectedSeat` | `number \| null` | ❌ | `null` | Aktuálně vybrané sedadlo |
| `onSeatSelect` | `function` | ❌ | - | Callback při kliknutí na sedadlo |
| `ownerName` | `string` | ❌ | `'Řidič'` | Jméno majitele vozidla |
| `mode` | `'interactive' \| 'display'` | ✅ | - | Režim komponenty |
| `className` | `string` | ❌ | `''` | Dodatečné CSS třídy |

### Datové typy

```typescript
interface SeatData {
  position: number;           // Pozice sedadla (1-7)
  position_label?: string;    // Vlastní označení pozice
  user_name?: string;         // Jméno obsazujícího uživatele
  occupied?: boolean;         // Je sedadlo obsazené?
}
```

### Stavy sedadel

```typescript
const SeatState = {
  FREE: 'free',           // Volné sedadlo (SVG s mírným grayscale)
  SELECTED: 'selected',   // Vybrané sedadlo (SVG se zeleným filtrem)
  OCCUPIED: 'occupied',   // Obsazené sedadlo (SVG s modrým filtrem)
  DRIVER: 'driver',       // Sedadlo řidiče (SVG se zlatým/žlutým filtrem)
} as const;
```

### CSS Filtry pro vizuální stavy

- **Řidič**: `sepia(1) saturate(3) hue-rotate(30deg) brightness(1.1)`- zlatá
/žlutá barva
- **Obsazené**: `sepia(0.8) saturate(2) hue-rotate(200deg) brightness(0.9)` -
modrá barva
- **Vybrané**: `sepia(0.7) saturate(2.5) hue-rotate(90deg) brightness(1.1)` -
zelená barva
- **Volné**: `grayscale(0.3) brightness(1.1) contrast(0.9)` - přirozené s mírným
grayscale
- **Hover**: `sepia(0.2) saturate(1.5) hue-rotate(200deg) brightness(1.2)` -
světle modré s zoom efektem

## Použití

### Základní použití - Interaktivní režim

```tsx
import React, { useState } from 'react';
import SeatRenderer from './components/SeatRenderer';

const CarBooking = () => {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  
  const seats = [
    { position: 1, user_name: 'Jan Novák', occupied: true }, // Řidič
    { position: 2 }, // Volné
    { position: 3, user_name: 'Anna Svoboda', occupied: true }, // Obsazené
    { position: 4 }, // Volné
  ];

  return (
    <SeatRenderer
      layout="SEDAQ"
      seats={seats}
      selectedSeat={selectedSeat}
      onSeatSelect={setSelectedSeat}
      ownerName="Jan Novák"
      mode="interactive"
    />
  );
};
```

### Pouze zobrazení - Display režim

```tsx
const CarOverview = () => {
  const seats = [
    { position: 1, user_name: 'Marie Nová', occupied: true },
    { position: 2, user_name: 'Petr Novotný', occupied: true },
  ];

  return (
    <SeatRenderer
      layout="TRAPAQ"
      seats={seats}
      ownerName="Marie Nová"
      mode="display"
    />
  );
};
```

### Kompletní příklad s API integrací

```tsx
import React, { useState, useEffect } from 'react';
import SeatRenderer from './components/SeatRenderer';
import type { SeatData } from './components/SeatRenderer';

const BookingSeatSelection = ({ carId }: { carId: string }) => {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [carLayout, setCarLayout] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  
  useEffect(() => {
    // Načtení dat auta a sedadel z API
    const fetchCarData = async () => {
      try {
        const response = await fetch(`/api/cars/${carId}`);
        const carData = await response.json();
        
        setSeats(carData.seats);
        setCarLayout(carData.layout);
        setOwnerName(carData.owner_name);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
      }
    };
    
    fetchCarData();
  }, [carId]);

  const handleSeatSelection = async (position: number | null) => {
    if (position === null) {
      // Zrušení rezervace
      setSelectedSeat(null);
      return;
    }

    try {
      // Volání API pro rezervaci sedadla
      await fetch(`/api/cars/${carId}/seats/${position}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      setSelectedSeat(position);
    } catch (error) {
      console.error('Chyba při rezervaci sedadla:', error);
    }
  };

  return (
    <div>
      <h2>Výběr sedadla</h2>
      <SeatRenderer
        layout={carLayout}
        seats={seats}
        selectedSeat={selectedSeat}
        onSeatSelect={handleSeatSelection}
        ownerName={ownerName}
        mode="interactive"
      />
      
      {selectedSeat && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#e7f5e7' }}>
          ✅ Vybrali jste sedadlo #{selectedSeat}
          <button 
            onClick={() => handleSeatSelection(null)}
            style={{ marginLeft: '1rem' }}
          >
            Zrušit výběr
          </button>
        </div>
      )}
    </div>
  );
};
```

## Stylování

Komponenta používá `styled-components` pro stylování. Všechny styly
jsou zapouzdřené v komponentě.

### Přizpůsobení vzhledu

```tsx
// Vlastní CSS třída
<SeatRenderer
  {...props}
  className="my-custom-seat-renderer"
/>
```

```css
/* Vlastní styly */
.my-custom-seat-renderer {
  max-width: 600px;
  margin: 0 auto;
}
```

## Technické detaily

### Závislosti

- `react` (>= 16.8.0)
- `styled-components` (>= 5.0.0)

### Assets

Komponenta vyžaduje následující SVG assets:

- `sedan.svg` - SVG obrázek sedanu
- `coupe.svg` - SVG obrázek kupé  
- `minivan.svg` - SVG obrázek minivanu
- `seat.svg` - SVG obrázek sedadla (používá se pro všechny pozice)

### Instalace styled-components

```bash
npm install styled-components
npm install --save-dev @types/styled-components  # Pro TypeScript
```

### Prohlížeče

- Moderní prohlížeče (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Mobilní prohlížeče (iOS Safari 12+, Chrome Mobile 60+)

## Příklady rozložení

### Sedan (SEDAQ)

```[]
[1-Řidič] [2]
[3]       [4]
```

### Kupé (TRAPAQ)  

```[]
[1-Řidič] [2]
```

### Minivan (PRAQ)

```[]
[1-Řidič] [2]
[3] [4] [5]
[6]     [7]
```

## Nejčastější problémy

### Q: Sedadlo není klikatelné

A: Zkontrolujte, že:

- `mode="interactive"`
- `onSeatSelect` callback je definován
- Sedadlo není obsazené (`occupied: false`)
- Sedadlo není pozice 1 (řidič)

### Q: Nesprávné zobrazení layoutu  

A: Zkontrolujte hodnotu `layout` prop. Podporované hodnoty jsou `SEDAQ`,
`TRAPAQ`, `PRAQ`.

### Q: Změny v `seats` se nepromítají

A: Ujistěte se, že předáváte nový array reference, ne mutujete existující array.

## Roadmap

- <input type="checkbox" checked> Podpora vlastních SVG ikon pro různé typy vozů
- <input type="checkbox"> Animace při změně stavu sedadel  
- <input type="checkbox"> Podpora pro více řidičů
- <input type="checkbox"> Touch gestures pro mobilní zařízení
- <input type="checkbox"> Podpora pro přístupnost (ARIA labels)
- <input type="checkbox"> Podpora pro více jazyků (i18n)

## Licence

MIT License
