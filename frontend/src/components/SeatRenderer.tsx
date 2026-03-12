import React from 'react';
import styled from 'styled-components';
import sedanSvg from '../assets/sedan.svg';
import coupeSvg from '../assets/coupe.svg';
import minivanSvg from '../assets/minivan.svg';
import seatSvg from '../assets/seat.svg';
import Loader from './Loader';

// TODO: add names?

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

// Seat states
export const SeatState = {
  FREE: 'free',
  SELECTED: 'selected',
  OCCUPIED: 'occupied',
  DRIVER: 'driver',
} as const;

export type SeatStateType = typeof SeatState[keyof typeof SeatState];

// Styled components
const SeatRendererContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  // background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  max-width: 300px;
  width: 100%;
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

  width: 29.33%;   // approx 5.5rem/300px = 29.33%
  height: 35.2%;  // approx 6.6rem/300px = 35.2%
  border: none;
  background: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: ${props => props.$interactive && props.$state !== SeatState.OCCUPIED && props.$state !== SeatState.DRIVER ? 'pointer' : 'default'};

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
  top: 22%;
  right: 12%;
  font-size: 14px;
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

// Main component
export const SeatRenderer: React.FC<SeatRendererProps> = ({
  layout,
  seats,
  selectedSeat,
  onSeatSelect,
  ownerName = 'Řidič',
  mode = 'interactive',
  className = '',
}) => {
  // Normalize layout string
  const normalizedLayout = layout.toLowerCase();
  
  // Preload images and loading state
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

  // Preload assets – reload car image on layout change; seat image only once
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
  
  // Map seats by position
  const seatByPosition = React.useMemo(() => {
    const map: Record<number, SeatData> = {};
    seats.forEach(seat => {
      map[seat.position] = seat;
    });
    return map;
  }, [seats]);

  // Determine seat state
  const getSeatState = (position: number): SeatStateType => {
    if (position === 1) return SeatState.DRIVER; // Position 1 is always driver
    
    const seat = seatByPosition[position];
    if (seat?.occupied || seat?.user_name) return SeatState.OCCUPIED;
    if (selectedSeat === position) return SeatState.SELECTED;
    return SeatState.FREE;
  };

  // Get seat position on SVG (in percent)
  const getSeatPosition = (position: number): { top: number; left: number } => {
    switch (normalizedLayout) {
      case 'sedaq':
      case 'sedan (4 seats)':
        switch (position) {
          case 1: return { top: 47, left: 34 }; // Driver - front left
          case 2: return { top: 47, left: 64 }; // Passenger - front right
          case 3: return { top: 70, left: 34 }; // Rear left
          case 4: return { top: 70, left: 64 }; // Rear right
          default: return { top: 50, left: 50 };
        }
        
      case 'trapaq':
      case 'coupé (2 seats)':
        switch (position) {
          case 1: return { top: 57, left: 33 }; // Driver
          case 2: return { top: 57, left: 67 }; // Passenger
          default: return { top: 57, left: 50 };
        }
        
      case 'praq':
      case 'minivan (7 seats)':
        switch (position) {
          case 1: return { top: 44, left: 35 }; // Driver - front left
          case 2: return { top: 44, left: 65 }; // Passenger - front right
          case 3: return { top: 64, left: 25 }; // Middle left
          case 4: return { top: 64, left: 50 }; // Middle center
          case 5: return { top: 64, left: 75 }; // Middle right
          case 6: return { top: 84, left: 35 }; // Rear left
          case 7: return { top: 84, left: 65 }; // Rear right
          default: return { top: 50, left: 50 };
        }
        
      default:
        return { top: 50, left: 50 };
    }
  };

  // Handle seat click
  const handleSeatClick = (position: number) => {
    if (mode !== 'interactive' || !onSeatSelect) return;
    
    const state = getSeatState(position);
    if (state === SeatState.OCCUPIED || state === SeatState.DRIVER) return;
    
    // If seat is already selected, deselect; otherwise select
    onSeatSelect(selectedSeat === position ? null : position);
  };

  // Single seat component
  const SeatComponent: React.FC<{ position: number }> = ({ position }) => {
    const seat = seatByPosition[position];
    const state = getSeatState(position);
    const isInteractive = mode === 'interactive';
    const isDriver = position === 1;
    const seatPosition = getSeatPosition(position);

    // Tooltip & aria-label text
    let tooltipText = '';
    let ariaLabel = '';
    if (isDriver) {
      tooltipText = `Řidič: ${ownerName} - nedostupné`;
      ariaLabel = `Řidič: ${ownerName}, sedadlo nedostupné`;
    } else if (state === SeatState.OCCUPIED) {
      tooltipText = seat?.user_name ? `Obsazeno: ${seat.user_name}` : 'Obsazeno';
      ariaLabel = seat?.user_name ? `Obsazeno: ${seat.user_name}` : `Obsazené sedadlo`;
    } else if (state === SeatState.SELECTED) {
      tooltipText = 'Vaše vybrané sedadlo';
      ariaLabel = 'Vaše vybrané sedadlo';
    } else {
      tooltipText = 'Volné sedadlo - klikněte pro výběr';
      ariaLabel = 'Volné sedadlo, klikněte pro výběr';
    }

    // Add seat number/label to aria-label
    if (!isDriver) {
      ariaLabel += seat?.position_label ? `, pozice ${seat.position_label}` : `, pozice ${position}`;
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
        aria-label={ariaLabel}
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

  // Render car with seats as overlay
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
      
      {/* Legend */}
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
