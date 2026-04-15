import { useMemo, useState } from 'react';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';
import { getSeatPositionLabel } from '../utils/seatUtils';

type LayoutKey = 'sedan' | 'coupe' | 'minivan';

const labels = {
  sedan: 'SEDAQ',
  coupe: 'TRAPAQ',
  minivan: 'PRAQ',
} as const;

export default function SeatRendererLabPage() {
  const [selectedSeats, setSelectedSeats] = useState<Record<LayoutKey, number | null>>({
    sedan: null,
    coupe: null,
    minivan: null,
  });

  const sedanSeats: SeatData[] = useMemo(
    () => [
      { position: 1, position_label: '1', user_name: 'Jan Novák', occupied: true },
      { position: 2, position_label: '2' },
      { position: 3, position_label: '3', user_name: 'Anna Svoboda', occupied: true },
      { position: 4, position_label: '4' },
    ],
    [],
  );

  const coupeSeats: SeatData[] = useMemo(
    () => [
      { position: 1, position_label: '1', user_name: 'Marie Nová', occupied: true },
      { position: 2, position_label: '2' },
    ],
    [],
  );

  const minivanSeats: SeatData[] = useMemo(
    () => [
      { position: 1, position_label: '1', user_name: 'Petr Dvořák', occupied: true },
      { position: 2, position_label: '2' },
      { position: 3, position_label: '3', user_name: 'Tomáš Kraus', occupied: true },
      { position: 4, position_label: '4' },
      { position: 5, position_label: '5', user_name: 'Eva Horáková', occupied: true },
      { position: 6, position_label: '6' },
      { position: 7, position_label: '7' },
    ],
    [],
  );

  const resetAll = () => {
    setSelectedSeats({ sedan: null, coupe: null, minivan: null });
  };

  const setPreset = (layout: LayoutKey, position: number) => {
    setSelectedSeats(prev => ({ ...prev, [layout]: position }));
  };

  return (
    <div className="min-h-screen container-light-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <section className="text-center space-y-2">
          <h1 className="page-title">SeatRenderer Lab</h1>
          <p className="text-muted max-w-3xl mx-auto">
            Konsolidovaná testovací stránka ze všech demo variant: interaktivní výběr,
            pouze zobrazení, hraniční scénáře a kontrola mapování pozic.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="dialog-bg-light border border-light rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold text-secondary text-center">Sedan Interaktivní</h2>
            <SeatRenderer
              layout="SEDAQ"
              seats={sedanSeats}
              selectedSeat={selectedSeats.sedan}
              onSeatSelect={position => setSelectedSeats(prev => ({ ...prev, sedan: position }))}
              ownerName="Jan Novák"
              mode="interactive"
            />
            <p className="text-sm text-muted text-center">
              Vybráno: {selectedSeats.sedan ?? 'žádné'}
              {selectedSeats.sedan && ` (${getSeatPositionLabel(labels.sedan, selectedSeats.sedan)})`}
            </p>
          </article>

          <article className="dialog-bg-light border border-light rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold text-secondary text-center">Kupé Interaktivní</h2>
            <SeatRenderer
              layout="TRAPAQ"
              seats={coupeSeats}
              selectedSeat={selectedSeats.coupe}
              onSeatSelect={position => setSelectedSeats(prev => ({ ...prev, coupe: position }))}
              ownerName="Marie Nová"
              mode="interactive"
            />
            <p className="text-sm text-muted text-center">
              Vybráno: {selectedSeats.coupe ?? 'žádné'}
              {selectedSeats.coupe && ` (${getSeatPositionLabel(labels.coupe, selectedSeats.coupe)})`}
            </p>
          </article>

          <article className="dialog-bg-light border border-light rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold text-secondary text-center">Minivan Interaktivní</h2>
            <SeatRenderer
              layout="PRAQ"
              seats={minivanSeats}
              selectedSeat={selectedSeats.minivan}
              onSeatSelect={position => setSelectedSeats(prev => ({ ...prev, minivan: position }))}
              ownerName="Petr Dvořák"
              mode="interactive"
            />
            <p className="text-sm text-muted text-center">
              Vybráno: {selectedSeats.minivan ?? 'žádné'}
              {selectedSeats.minivan && ` (${getSeatPositionLabel(labels.minivan, selectedSeats.minivan)})`}
            </p>
          </article>
        </section>

        <section className="dialog-bg-blue border border-light rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-secondary">Kontrolní scénáře z původních demo stránek</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="dialog-bg-light border border-light rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-secondary">Pouze zobrazení</h3>
              <SeatRenderer layout="SEDAQ" seats={sedanSeats} ownerName="Jan Novák" mode="display" />
            </article>

            <article className="dialog-bg-light border border-light rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-secondary">Neznámý layout</h3>
              <SeatRenderer layout="UNKNOWN_LAYOUT" seats={[]} mode="display" />
              <p className="text-sm text-danger">Fallback na výchozí vozidlo funguje.</p>
            </article>

            <article className="dialog-bg-light border border-light rounded-xl p-4 space-y-3 md:col-span-2">
              <h3 className="font-semibold text-secondary">Prázdná data v interaktivním režimu</h3>
              <div className="max-w-xl mx-auto">
                <SeatRenderer layout="SEDAQ" seats={[]} ownerName="Test uživatel" mode="interactive" />
              </div>
            </article>
          </div>
        </section>

        <section className="dialog-bg-light border border-light rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-secondary">Rychlé akce</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" className="button-danger" onClick={resetAll}>
              Zrušit všechny výběry
            </button>
            <button type="button" className="button-success" onClick={() => setPreset('sedan', 4)}>
              Předvolba Sedan 4
            </button>
            <button type="button" className="button-info" onClick={() => setPreset('coupe', 2)}>
              Předvolba Kupé 2
            </button>
            <button type="button" className="button-info" onClick={() => setPreset('minivan', 7)}>
              Předvolba Minivan 7
            </button>
          </div>

          <p className="text-sm text-muted">
            Aktuální stav: Sedan {selectedSeats.sedan ?? 'žádné'}, Kupé {selectedSeats.coupe ?? 'žádné'}, Minivan{' '}
            {selectedSeats.minivan ?? 'žádné'}.
          </p>
        </section>
      </div>
    </div>
  );
}
