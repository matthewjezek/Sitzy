import { useState } from 'react';
import SeatRenderer, { getSeatPositionLabel } from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';

export default function SeatPositionTest() {
  const [selectedSeats, setSelectedSeats] = useState<{
    sedan: number | null;
    coupe: number | null;
    minivan: number | null;
  }>({
    sedan: null,
    coupe: null,
    minivan: null,
  });

  // Test data
  const sedanSeats: SeatData[] = [
    { position: 1, user_name: 'Řidič', occupied: true },
    { position: 2 },
    { position: 3 },
    { position: 4 },
  ];

  const coupeSeats: SeatData[] = [
    { position: 1, user_name: 'Řidič', occupied: true },
    { position: 2 },
  ];

  const minivanSeats: SeatData[] = [
    { position: 1, user_name: 'Řidič', occupied: true },
    { position: 2 },
    { position: 3 },
    { position: 4 },
    { position: 5 },
    { position: 6 },
    { position: 7 },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            🎯 Test pozicování sedadel na SVG
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
            Sedadla jsou nyní umístěna přímo na obrázku vozidla jako overlay
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gap: '3rem', 
          gridTemplateColumns: '1fr',
          alignItems: 'start'
        }}>
          
          {/* Sedan */}
          <div style={{ 
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  margin: 0
                }}>
                  🚘 Sedan
                </h2>
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  Pozice: Řidič (přední levý), Spolujezdec (přední pravý), Zadní levý, Zadní pravý
                </p>
              </div>
              <div style={{ 
                background: '#f3f4f6',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Vybrané: {selectedSeats.sedan || 'žádné'}
                {selectedSeats.sedan && (
                  <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontWeight: 500 }}>
                    ({getSeatPositionLabel('SEDAQ', selectedSeats.sedan)})
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SeatRenderer
                layout="SEDAQ"
                seats={sedanSeats}
                selectedSeat={selectedSeats.sedan}
                onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, sedan: position }))}
                ownerName="Jan Novák"
                mode="interactive"
              />
            </div>
          </div>

          {/* Kupé */}
          <div style={{ 
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  margin: 0
                }}>
                  🏎️ Kupé
                </h2>
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  Pozice: Řidič (levý), Spolujezdec (pravý)
                </p>
              </div>
              <div style={{ 
                background: '#f3f4f6',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Vybrané: {selectedSeats.coupe || 'žádné'}
                {selectedSeats.coupe && (
                  <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontWeight: 500 }}>
                    ({getSeatPositionLabel('TRAPAQ', selectedSeats.coupe)})
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SeatRenderer
                layout="TRAPAQ"
                seats={coupeSeats}
                selectedSeat={selectedSeats.coupe}
                onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, coupe: position }))}
                ownerName="Marie Nová"
                mode="interactive"
              />
            </div>
          </div>

          {/* Minivan */}
          <div style={{ 
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  margin: 0
                }}>
                  🚐 Minivan
                </h2>
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  Pozice: 1-2 (přední), 3-4-5 (střední), 6-7 (zadní)
                </p>
              </div>
              <div style={{ 
                background: '#f3f4f6',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Vybrané: {selectedSeats.minivan || 'žádné'}
                {selectedSeats.minivan && (
                  <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontWeight: 500 }}>
                    ({getSeatPositionLabel('PRAQ', selectedSeats.minivan)})
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SeatRenderer
                layout="PRAQ"
                seats={minivanSeats}
                selectedSeat={selectedSeats.minivan}
                onSeatSelect={(position) => setSelectedSeats(prev => ({ ...prev, minivan: position }))}
                ownerName="Petr Dvořák"
                mode="interactive"
              />
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div style={{
          marginTop: '3rem',
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#374151'
          }}>
            🎮 Testovací ovládání
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
                fontSize: '0.9rem'
              }}
            >
              🗑️ Zrušit všechny
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
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              🚘 Sedan #4
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
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              🏎️ Kupé #2
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
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              🚐 Minivan #7
            </button>
          </div>
          
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              ℹ️ Aktuální stav:
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
              <strong>Sedan:</strong> {selectedSeats.sedan || 'žádné'}
              {selectedSeats.sedan && ` (${getSeatPositionLabel('SEDAQ', selectedSeats.sedan)})`} |
              <strong> Kupé:</strong> {selectedSeats.coupe || 'žádné'}
              {selectedSeats.coupe && ` (${getSeatPositionLabel('TRAPAQ', selectedSeats.coupe)})`} |
              <strong> Minivan:</strong> {selectedSeats.minivan || 'žádné'}
              {selectedSeats.minivan && ` (${getSeatPositionLabel('PRAQ', selectedSeats.minivan)})`}
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          <p>🎯 Sedadla jsou nyní umístěna přímo na SVG obrázku vozidla jako overlay</p>
          <p>💡 Pozice jsou vypočítány v procentech relativně k velikosti obrázku</p>
        </div>
      </div>
    </div>
  );
}
