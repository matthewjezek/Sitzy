import { useState } from 'react';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';

export default function SeatRendererTestPage() {
  const [selectedSeatSedan, setSelectedSeatSedan] = useState<number | null>(null);
  const [selectedSeatCoupe, setSelectedSeatCoupe] = useState<number | null>(null);
  const [selectedSeatMinivan, setSelectedSeatMinivan] = useState<number | null>(null);

  // Testovací data pro Sedan
  const sedanSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Jan Novák', occupied: true },
    { position: 2, position_label: '2' },
    { position: 3, position_label: '3', user_name: 'Anna Svoboda', occupied: true },
    { position: 4, position_label: '4' },
  ];

  // Testovací data pro Kupé
  const coupeSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Marie Nová', occupied: true },
    { position: 2, position_label: '2' },
  ];

  // Testovací data pro Minivan
  const minivanSeats: SeatData[] = [
    { position: 1, position_label: '1', user_name: 'Petr Dvořák', occupied: true },
    { position: 2, position_label: '2' },
    { position: 3, position_label: '3', user_name: 'Tomáš Kraus', occupied: true },
    { position: 4, position_label: '4' },
    { position: 5, position_label: '5', user_name: 'Eva Horáková', occupied: true },
    { position: 6, position_label: '6' },
    { position: 7, position_label: '7' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SeatRenderer - Testovací stránka
          </h1>
          <p className="text-gray-600">
            SVG sedadla s CSS filtry - realističtější výběr sedadel
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          
          {/* Sedan - Interaktivní */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Sedan - Interaktivní
            </h2>
            <SeatRenderer
              layout="SEDAQ"
              seats={sedanSeats}
              selectedSeat={selectedSeatSedan}
              onSeatSelect={(position) => {
                setSelectedSeatSedan(position);
                console.log('Sedan - Vybrané sedadlo:', position);
              }}
              ownerName="Jan Novák"
              mode="interactive"
            />
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Vybrané sedadlo:</strong> {selectedSeatSedan || 'žádné'}
              </p>
            </div>
          </div>

          {/* Sedan - Pouze zobrazení */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Sedan - Pouze zobrazení
            </h2>
            <SeatRenderer
              layout="SEDAQ"
              seats={sedanSeats}
              ownerName="Jan Novák"
              mode="display"
            />
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-700">
                💡 Toto je informativní zobrazení pro majitele auta
              </p>
            </div>
          </div>

          {/* Kupé - Interaktivní */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Kupé - Interaktivní
            </h2>
            <SeatRenderer
              layout="TRAPAQ"
              seats={coupeSeats}
              selectedSeat={selectedSeatCoupe}
              onSeatSelect={(position) => {
                setSelectedSeatCoupe(position);
                console.log('Kupé - Vybrané sedadlo:', position);
              }}
              ownerName="Marie Nová"
              mode="interactive"
            />
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Vybrané sedadlo:</strong> {selectedSeatCoupe || 'žádné'}
              </p>
            </div>
          </div>

          {/* Minivan - Interaktivní */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Minivan - Interaktivní
            </h2>
            <SeatRenderer
              layout="PRAQ"
              seats={minivanSeats}
              selectedSeat={selectedSeatMinivan}
              onSeatSelect={(position) => {
                setSelectedSeatMinivan(position);
                console.log('Minivan - Vybrané sedadlo:', position);
              }}
              ownerName="Petr Dvořák"
              mode="interactive"
            />
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Vybrané sedadlo:</strong> {selectedSeatMinivan || 'žádné'}
              </p>
            </div>
          </div>

          {/* Neznámý layout - test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Neznámý typ vozidla
            </h2>
            <SeatRenderer
              layout="UNKNOWN_LAYOUT"
              seats={[]}
              mode="display"
            />
            <div className="mt-4 p-3 bg-red-50 rounded">
              <p className="text-sm text-red-700">
                ⚠️ Test neznámého layoutu
              </p>
            </div>
          </div>

          {/* Prázdná data - test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Prázdná data
            </h2>
            <SeatRenderer
              layout="SEDAQ"
              seats={[]}
              mode="interactive"
              ownerName="Test uživatel"
            />
            <div className="mt-4 p-3 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-700">
                ⚠️ Test s prázdnými daty sedadel
              </p>
            </div>
          </div>

        </div>

        {/* Ovládací panel */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Ovládací panel</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => {
                setSelectedSeatSedan(null);
                setSelectedSeatCoupe(null);
                setSelectedSeatMinivan(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Zrušit všechny výběry
            </button>
            
            <button
              onClick={() => setSelectedSeatSedan(4)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Vybrat sedadlo 4 (Sedan)
            </button>
            
            <button
              onClick={() => setSelectedSeatCoupe(2)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Vybrat sedadlo 2 (Kupé)
            </button>
            
            <button
              onClick={() => setSelectedSeatMinivan(7)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Vybrat sedadlo 7 (Minivan)
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Aktuální výběry:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Sedan:</strong> {selectedSeatSedan || 'žádné'}</p>
              <p><strong>Kupé:</strong> {selectedSeatCoupe || 'žádné'}</p>
              <p><strong>Minivan:</strong> {selectedSeatMinivan || 'žádné'}</p>
            </div>
          </div>
        </div>

        {/* Informace o komponentě */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ℹ️ O komponentě SeatRenderer
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Vlastnosti:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Interaktivní i informativní režim</li>
                <li>Automatické označení řidiče (pozice 1)</li>
                <li>Vizuální rozlišení stavů sedadel</li>
                <li>Responzivní design</li>
                <li>Podpora pro Sedan, Kupé, Minivan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Stavy sedadel:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded border"></div>
                  <span className="text-blue-700">Řidič (pozice 1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-blue-700">Volné sedadlo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded"></div>
                  <span className="text-blue-700">Vybrané sedadlo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded"></div>
                  <span className="text-blue-700">Obsazené sedadlo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
