import React from 'react';
import styled from 'styled-components';
import sedanSvg from '../assets/sedan.svg';
import coupeSvg from '../assets/coupe.svg';
import minivanSvg from '../assets/minivan.svg';
import seatSvg from '../assets/seat.svg';
import Loader from './Loader';

// TODO: přidat jména?

export interface SeatData {
  position: number;
  position_label?: string;
  user_name?: string;
  occupied?: boolean;
}

export interface SeatRendererProps {
  layout: 'SEDAQ' | 'TRAPAQ' | 'PRAQ' | string;
  seats: SeatData[];
  selectedSeat?: number | null;
  onSeatSelect?: (position: number | null) => void;
  ownerName?: string;
  mode: 'interactive' | 'display';
  className?: string;
}

// Stavy sedadel
export const SeatState = {
  FREE: 'free',
  SELECTED: 'selected',
  OCCUPIED: 'occupied',
  DRIVER: 'driver',
} as const;

export type SeatStateType = typeof SeatState[keyof typeof SeatState];

// Styled komponenty
const SeatRendererContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const CarContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CarImage = styled.img`
  width: 300px;
  height: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  opacity: 0.9;
`;

const SeatOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const SeatButton = styled.button<{
  $state: SeatStateType;
  $interactive: boolean;
  $top: number;
  $left: number;
}>`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  
  width: 5.5rem;
  height: 6.6rem;
  border: none;
  background: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: ${props => props.$interactive && props.$state !== SeatState.OCCUPIED && props.$state !== SeatState.DRIVER ? 'pointer' : 'default'};

  /* SVG obrázek sedadla */
  .seat-icon {
    width: 100%;
    height: 100%;
    transition: all 0.2s ease;
    
    ${props => {
      switch (props.$state) {
        case SeatState.DRIVER:
          return `
            filter: sepia(1) saturate(3) hue-rotate(30deg) brightness(1.1);
          `;
        case SeatState.OCCUPIED:
          return `
            filter: sepia(0.8) saturate(2) hue-rotate(200deg) brightness(0.9);
          `;
        case SeatState.SELECTED:
          return `
            filter: sepia(0.7) saturate(2.5) hue-rotate(90deg) brightness(1.1);
          `;
        case SeatState.FREE:
        default:
          return `
            filter: grayscale(0.3) brightness(1.1) contrast(0.9);
            
            ${props.$interactive ? `
              &:hover {
                filter: sepia(0.2) saturate(1.5) hue-rotate(200deg) brightness(1.2);
                transform: scale(1.1);
              }
            ` : ''}
          `;
      }
    }}
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const SeatNumber = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 0.75rem;
  color: #2d3748;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  pointer-events: none;
`;

const DriverIcon = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  color: #d69e2e;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  pointer-events: none;
`;

const LayoutTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
`;

// Hlavní komponenta
export const SeatRenderer: React.FC<SeatRendererProps> = ({
  layout,
  seats,
  selectedSeat,
  onSeatSelect,
  ownerName = 'Řidič',
  mode = 'interactive',
  className = '',
}) => {
  // Normalizace layoutu
  const normalizedLayout = layout.toLowerCase();
  
  // Přednačtení obrázků a stav načtení
  const carMeta = React.useMemo(() => {
    switch (normalizedLayout) {
      case 'sedaq':
      case 'sedan (4 seats)':
        return { carSvgSrc: sedanSvg, altText: 'Sedan', maxSeats: 4 } as const;
      case 'trapaq':
      case 'coupé (2 seats)':
        return { carSvgSrc: coupeSvg, altText: 'Kupé', maxSeats: 2 } as const;
      case 'praq':
      case 'minivan (7 seats)':
        return { carSvgSrc: minivanSvg, altText: 'Minivan', maxSeats: 7 } as const;
      default:
        return { carSvgSrc: sedanSvg, altText: 'Vozidlo', maxSeats: 4 } as const;
    }
  }, [normalizedLayout]);

  const [carLoaded, setCarLoaded] = React.useState(false);
  const [seatLoaded, setSeatLoaded] = React.useState(false);

  // Přednačtení assets – při změně layoutu znovu načti auto; sedadlo stačí jednou
  React.useEffect(() => {
    let canceled = false;
    setCarLoaded(false);

    const imgCar = new Image();
    imgCar.onload = () => { if (!canceled) setCarLoaded(true); };
    imgCar.onerror = () => { if (!canceled) setCarLoaded(true); }; // fallback, ať UI neuvízne
    imgCar.src = carMeta.carSvgSrc;

    if (!seatLoaded) {
      const imgSeat = new Image();
      imgSeat.onload = () => { if (!canceled) setSeatLoaded(true); };
      imgSeat.onerror = () => { if (!canceled) setSeatLoaded(true); };
      imgSeat.src = seatSvg;
    }

    return () => { canceled = true; };
  }, [carMeta.carSvgSrc, seatLoaded]);
  
  // Mapa sedadel podle pozice
  const seatByPosition = React.useMemo(() => {
    const map: Record<number, SeatData> = {};
    seats.forEach(seat => {
      map[seat.position] = seat;
    });
    return map;
  }, [seats]);

  // Funkce pro určení stavu sedadla
  const getSeatState = (position: number): SeatStateType => {
    if (position === 1) return SeatState.DRIVER; // Pozice 1 je vždy řidič
    
    const seat = seatByPosition[position];
    if (seat?.occupied || seat?.user_name) return SeatState.OCCUPIED;
    if (selectedSeat === position) return SeatState.SELECTED;
    return SeatState.FREE;
  };

  // Funkce pro získání pozice sedadla na SVG (v procentech)
  const getSeatPosition = (position: number): { top: number; left: number } => {
    switch (normalizedLayout) {
      case 'sedaq':
      case 'sedan (4 seats)':
        switch (position) {
          case 1: return { top: 47, left: 34 }; // Řidič - přední levý
          case 2: return { top: 47, left: 64 }; // Spolujezdec - přední pravý
          case 3: return { top: 70, left: 34 }; // Zadní levý
          case 4: return { top: 70, left: 64 }; // Zadní pravý
          default: return { top: 50, left: 50 };
        }
        
      case 'trapaq':
      case 'coupé (2 seats)':
        switch (position) {
          case 1: return { top: 57, left: 33 }; // Řidič
          case 2: return { top: 57, left: 67 }; // Spolujezdec
          default: return { top: 57, left: 50 };
        }
        
      case 'praq':
      case 'minivan (7 seats)':
        switch (position) {
          case 1: return { top: 44, left: 35 }; // Řidič - přední levý
          case 2: return { top: 44, left: 65 }; // Spolujezdec - přední pravý
          case 3: return { top: 64, left: 25 }; // Střední levý
          case 4: return { top: 64, left: 50 }; // Střední střed
          case 5: return { top: 64, left: 75 }; // Střední pravý
          case 6: return { top: 84, left: 35 }; // Zadní levý
          case 7: return { top: 84, left: 65 }; // Zadní pravý
          default: return { top: 50, left: 50 };
        }
        
      default:
        return { top: 50, left: 50 };
    }
  };

  // Funkce pro klik na sedadlo
  const handleSeatClick = (position: number) => {
    if (mode !== 'interactive' || !onSeatSelect) return;
    
    const state = getSeatState(position);
    if (state === SeatState.OCCUPIED || state === SeatState.DRIVER) return;
    
    // Pokud je sedadlo už vybráno, zruš výběr, jinak ho vyber
    onSeatSelect(selectedSeat === position ? null : position);
  };

  // Komponenta jednotlivého sedadla
  const SeatComponent: React.FC<{ position: number }> = ({ position }) => {
    const seat = seatByPosition[position];
    const state = getSeatState(position);
    const isInteractive = mode === 'interactive';
    const isDriver = position === 1;
    const seatPosition = getSeatPosition(position);

    // Tooltip text
    let tooltipText = '';
    if (isDriver) {
      tooltipText = `Řidič: ${ownerName} - nedostupné`;
    } else if (state === SeatState.OCCUPIED) {
      tooltipText = seat?.user_name ? `Obsazeno: ${seat.user_name}` : 'Obsazeno';
    } else if (state === SeatState.SELECTED) {
      tooltipText = 'Vaše vybrané sedadlo';
    } else {
      tooltipText = 'Volné sedadlo - klikněte pro výběr';
    }

    return (
      <SeatButton
        $state={state}
        $interactive={isInteractive}
        $top={seatPosition.top}
        $left={seatPosition.left}
        onClick={() => handleSeatClick(position)}
        disabled={!isInteractive || state === SeatState.OCCUPIED || state === SeatState.DRIVER}
        title={tooltipText}
      >
        <img 
          src={seatSvg} 
          alt="Sedadlo" 
          className="seat-icon"
        />
        {isDriver && <DriverIcon>🚗</DriverIcon>}
        <SeatNumber>{seat?.position_label || position}</SeatNumber>
      </SeatButton>
    );
  };

  // Renderování vozidla s sedadly jako overlay
  const renderCarWithSeats = () => {
    const { carSvgSrc, altText, maxSeats } = carMeta;

    return (
      <div>
        <LayoutTitle>{altText} ({maxSeats} míst)</LayoutTitle>
        <CarContainer>
          <CarImage
            src={carSvgSrc}
            alt={`${altText} - pohled shora`}
          />
          <SeatOverlay>
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map(position => (
              <SeatComponent key={position} position={position} />
            ))}
          </SeatOverlay>
        </CarContainer>
      </div>
    );
  };

  const ready = carLoaded && seatLoaded;

  if (!ready) {
    return (
      <SeatRendererContainer className={className}>
        <Loader />
      </SeatRendererContainer>
    );
  }

  return (
    <SeatRendererContainer className={className}>
      {renderCarWithSeats()}
      
      {/* Legenda */}
      {mode === 'interactive' && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          fontSize: '0.75rem', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <img 
              src={seatSvg} 
              alt="Řidič" 
              style={{ 
                width: '16px', 
                height: '16px',
                filter: 'sepia(1) saturate(3) hue-rotate(30deg) brightness(1.1)'
              }}
            />
            <span>Řidič</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <img 
              src={seatSvg} 
              alt="Volné" 
              style={{ 
                width: '16px', 
                height: '16px',
                filter: 'grayscale(0.3) brightness(1.1) contrast(0.9)'
              }}
            />
            <span>Volné</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <img 
              src={seatSvg} 
              alt="Vybrané" 
              style={{ 
                width: '16px', 
                height: '16px',
                filter: 'sepia(0.7) saturate(2.5) hue-rotate(90deg) brightness(1.1)'
              }}
            />
            <span>Vybrané</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <img 
              src={seatSvg} 
              alt="Obsazené" 
              style={{ 
                width: '16px', 
                height: '16px',
                filter: 'sepia(0.8) saturate(2) hue-rotate(200deg) brightness(0.9)'
              }}
            />
            <span>Obsazené</span>
          </div>
        </div>
      )}
    </SeatRendererContainer>
  );
};

export default SeatRenderer;
