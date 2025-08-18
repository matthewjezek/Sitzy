import { useState } from 'react';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';

export default function SeatRendererDemo() {
  const [selectedSeats, setSelectedSeats] = useState<{
    sedan: number | null;
    coupe: number | null;
    minivan: number | null;
  }>({
    sedan: null,
    coupe: null,
    minivan: null,
  });

  // Demo data
  const sedanSeats: SeatData[] = [
    { position: 1, user_name: 'Jan Novák', occupied: true },
    { position: 2 },
    { position: 3, user_name: 'Anna Svoboda', occupied: true },
    { position: 4 },
  ];

  const coupeSeats: SeatData[] = [
    { position: 1, user_name: 'Marie Nová', occupied: true },
    { position: 2 },
  ];

  const minivanSeats: SeatData[] = [
    { position: 1, user_name: 'Petr Dvořák', occupied: true },
    { position: 2 },
    { position: 3, user_name: 'Tomáš Kraus', occupied: true },
    { position: 4 },
    { position: 5, user_name: 'Eva Horáková', occupied: true },
    { position: 6 },
    { position: 7 },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            🚗 SeatRenderer Demo
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Realistická SVG sedadla s CSS filtry - pozicování jako overlay na vozidlech
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gap: '2rem', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        }}>
          
          {/* Sedan */}
          <div style={{ 
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              🚘 Sedan (4 místa)
            </h2>
            <SeatRenderer
              layout="SEDAQ"
              seats={sedanSeats}
              selectedSeat={selectedSeats.sedan}
              onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, sedan: position }))}
              ownerName="Jan Novák"
              mode="interactive"
            />
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <strong>Vybrané sedadlo:</strong> {selectedSeats.sedan || 'žádné'}
            </div>
          </div>

          {/* Kupé */}
          <div style={{ 
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              🏎️ Kupé (2 místa)
            </h2>
            <SeatRenderer
              layout="TRAPAQ"
              seats={coupeSeats}
              selectedSeat={selectedSeats.coupe}
              onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, coupe: position }))}
              ownerName="Marie Nová"
              mode="interactive"
            />
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <strong>Vybrané sedadlo:</strong> {selectedSeats.coupe || 'žádné'}
            </div>
          </div>

          {/* Minivan */}
          <div style={{ 
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            gridColumn: 'span 2',
            justifySelf: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              🚐 Minivan (7 míst)
            </h2>
            <SeatRenderer
              layout="PRAQ"
              seats={minivanSeats}
              selectedSeat={selectedSeats.minivan}
              onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, minivan: position }))}
              ownerName="Petr Dvořák"
              mode="interactive"
            />
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <strong>Vybrané sedadlo:</strong> {selectedSeats.minivan || 'žádné'}
            </div>
          </div>
        </div>

        {/* Ovládání */}
        <div style={{
          marginTop: '3rem',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ 
            color: 'white', 
            fontSize: '1.25rem', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🎮 Ovládací panel
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setSelectedSeats({ sedan: null, coupe: null, minivan: null })}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              🗑️ Zrušit všechny výběry
            </button>
            <button
              onClick={() => setSelectedSeats(prev => ({ ...prev, sedan: 4 }))}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚘 Vybrat sedadlo 4 (Sedan)
            </button>
            <button
              onClick={() => setSelectedSeats(prev => ({ ...prev, coupe: 2 }))}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏎️ Vybrat sedadlo 2 (Kupé)
            </button>
            <button
              onClick={() => setSelectedSeats(prev => ({ ...prev, minivan: 7 }))}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚐 Vybrat sedadlo 7 (Minivan)
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '0.9rem'
        }}>
          <p>✨ Komponenta používá originální SVG soubory pro každý typ vozidla</p>
          <p>🎯 Sedan: sedan.svg | Kupé: coupe.svg | Minivan: minivan.svg</p>
        </div>
      </div>
    </div>
  );
}
