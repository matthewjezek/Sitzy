import React, { useState } from 'react';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';

const SeatRendererExample: React.FC = () => {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // Ukázková data sedadel pro Sedan
  const sedanSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Jan Novák', occupied: true }, // Řidič
    { position: 2, position_label: '2' }, // Volné sedadlo
    { position: 3, position_label: '3', user_name: 'Anna Svoboda', occupied: true }, // Obsazené
    { position: 4, position_label: '4' }, // Volné sedadlo
  ];

  // Ukázková data pro Kupé
  const coupeSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Marie Nová', occupied: true }, // Řidič
    { position: 2, position_label: '2' }, // Volné sedadlo
  ];

  // Ukázková data pro Minivan
  const minivanSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Petr Dvořák', occupied: true }, // Řidič
    { position: 2, position_label: '2' }, // Volné sedadlo
    { position: 3, position_label: '3', user_name: 'Tomáš Kraus', occupied: true }, // Obsazené
    { position: 4, position_label: '4' }, // Volné sedadlo
    { position: 5, position_label: '5', user_name: 'Eva Horáková', occupied: true }, // Obsazené
    { position: 6, position_label: '6' }, // Volné sedadlo
    { position: 7, position_label: '7' }, // Volné sedadlo
  ];

  const handleSeatSelect = (position: number | null) => {
    setSelectedSeat(position);
    console.log('Vybráno sedadlo:', position);
  };

  return (
    <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        SeatRenderer - Ukázka komponenty s SVG sedadly
      </h1>
      
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        padding: '1rem',
        background: '#e0f2fe',
        borderRadius: '0.5rem'
      }}>
        <p style={{ margin: 0, color: '#0369a1' }}>
          🪑 Sedadla jsou nyní realistické SVG obrázky s CSS filtry pro různé stavy
        </p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        
        {/* Sedan - Interaktivní režim */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Sedan - Interaktivní výběr
          </h2>
          <SeatRenderer
            layout="SEDAQ"
            seats={sedanSeats}
            selectedSeat={selectedSeat}
            onSeatSelect={handleSeatSelect}
            ownerName="Jan Novák"
            mode="interactive"
          />
          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#6b7280' }}>
            Vybráno sedadlo: {selectedSeat || 'žádné'}
          </p>
        </div>

        {/* Sedan - Pouze zobrazení */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Sedan - Pouze zobrazení
          </h2>
          <SeatRenderer
            layout="SEDAQ"
            seats={sedanSeats}
            ownerName="Jan Novák"
            mode="display"
          />
        </div>

        {/* Kupé - Interaktivní */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Kupé - Interaktivní
          </h2>
          <SeatRenderer
            layout="TRAPAQ"
            seats={coupeSeats}
            selectedSeat={selectedSeat}
            onSeatSelect={handleSeatSelect}
            ownerName="Marie Nová"
            mode="interactive"
          />
        </div>

        {/* Minivan - Interaktivní */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Minivan - Interaktivní
          </h2>
          <SeatRenderer
            layout="PRAQ"
            seats={minivanSeats}
            selectedSeat={selectedSeat}
            onSeatSelect={handleSeatSelect}
            ownerName="Petr Dvořák"
            mode="interactive"
          />
        </div>

        {/* Test s neznámým layoutem */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Neznámý typ vozidla
          </h2>
          <SeatRenderer
            layout="UNKNOWN"
            seats={[]}
            mode="display"
          />
        </div>
      </div>

      {/* Ovládací prvky */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: 'white', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Ovládání</h3>
        <button
          onClick={() => setSelectedSeat(null)}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          Zrušit výběr
        </button>
        <button
          onClick={() => setSelectedSeat(4)}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Vybrat sedadlo 4
        </button>
      </div>
    </div>
  );
};

export default SeatRendererExample;
