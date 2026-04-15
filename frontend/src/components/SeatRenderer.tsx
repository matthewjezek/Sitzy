import React from 'react';
import styled, { css } from 'styled-components';
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

const seatFilters = {
  [SeatState.FREE]: 'grayscale(0.18) brightness(1.06) contrast(0.96)',
  [SeatState.SELECTED]: 'sepia(0.72) saturate(2.35) hue-rotate(92deg) brightness(1.08) drop-shadow(0 0 10px rgba(34, 197, 94, 0.24))',
  [SeatState.OCCUPIED]: 'sepia(0.82) saturate(1.9) hue-rotate(205deg) brightness(0.94) drop-shadow(0 0 10px rgba(59, 130, 246, 0.18))',
  [SeatState.DRIVER]: 'sepia(1) saturate(2.9) hue-rotate(30deg) brightness(1.08) drop-shadow(0 0 10px rgba(245, 158, 11, 0.24))',
} as const;

// Styled components
const SeatRendererContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: clamp(1rem, 2vw, 1.5rem);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92) 48%, rgba(241, 245, 249, 0.88) 100%);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);

  html.dark & {
    border: 1px solid rgba(71, 85, 105, 0.45);
    background:
      radial-gradient(circle at top, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.94) 52%, rgba(2, 6, 23, 0.94) 100%);
    box-shadow:
      0 28px 80px rgba(2, 6, 23, 0.55),
      inset 0 1px 0 rgba(148, 163, 184, 0.18);
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      border: 1px solid rgba(71, 85, 105, 0.45);
      background:
        radial-gradient(circle at top, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.94) 52%, rgba(2, 6, 23, 0.94) 100%);
      box-shadow:
        0 28px 80px rgba(2, 6, 23, 0.55),
        inset 0 1px 0 rgba(148, 163, 184, 0.18);
    }
  }
`;

const RendererHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
`;

const RendererTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;

  html.dark & {
    color: #f8fafc;
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      color: #f8fafc;
    }
  }
`;

const RendererSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #64748b;

  html.dark & {
    color: #94a3b8;
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      color: #94a3b8;
    }
  }
`;

const CarStage = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const CarFrame = styled.div`
  position: relative;
  width: min(100%, 26rem);
  padding: clamp(0.75rem, 1.8vw, 1rem);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(241, 245, 249, 0.86));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 12px 30px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 10% 12% auto;
    height: 58%;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(125, 211, 252, 0.18) 0%, rgba(125, 211, 252, 0.08) 35%, rgba(255, 255, 255, 0) 72%);
    filter: blur(10px);
    pointer-events: none;
  }

  html.dark & {
    border: 1px solid rgba(71, 85, 105, 0.45);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.92));
    box-shadow:
      inset 0 1px 0 rgba(148, 163, 184, 0.18),
      0 14px 36px rgba(2, 6, 23, 0.5);

    &::before {
      background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.07) 35%, rgba(2, 6, 23, 0) 72%);
    }
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      border: 1px solid rgba(71, 85, 105, 0.45);
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.92));
      box-shadow:
        inset 0 1px 0 rgba(148, 163, 184, 0.18),
        0 14px 36px rgba(2, 6, 23, 0.5);

      &::before {
        background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.07) 35%, rgba(2, 6, 23, 0) 72%);
      }
    }
  }
`;

const CarImage = styled.img`
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 10px 20px rgba(15, 23, 42, 0.16));
  opacity: 0.95;
`;

const SeatOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
`;

const SeatVisual = styled.img<{ $state: SeatStateType }>`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  pointer-events: none;
  filter: ${props => seatFilters[props.$state]};
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
`;

const SeatButton = styled.button<{
  $state: SeatStateType;
  $interactive: boolean;
  $layout: string;
  $top: number;
  $left: number;
}>`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  transform: translate(-50%, -50%);
  pointer-events: auto;

  width: ${props => props.$layout === 'praq' || props.$layout === 'minivan (7 seats)' ? '26.4%' : '29.33%'};
  height: ${props => props.$layout === 'praq' || props.$layout === 'minivan (7 seats)' ? '31.7%' : '35.2%'};
  /* Seat SVG has transparent margins; clip hit-test area to seat core to avoid overlap clicks */
  clip-path: ${props => props.$layout === 'praq' || props.$layout === 'minivan (7 seats)'
    ? 'inset(16% 0 12% 0)'
    : 'inset(17% 0 12% 0)'};
  -webkit-clip-path: ${props => props.$layout === 'praq' || props.$layout === 'minivan (7 seats)'
    ? 'inset(16% 0 12% 0)'
    : 'inset(17% 0 12% 0)'};
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
  cursor: ${props => props.$interactive && props.$state !== SeatState.OCCUPIED && props.$state !== SeatState.DRIVER ? 'pointer' : 'default'};
  z-index: ${props => props.$state === SeatState.SELECTED ? 4 : props.$state === SeatState.OCCUPIED ? 3 : 2};

  &:hover:not(:disabled) {
    transform: translate(-50%, -50%) scale(1.04);
  }

  &:focus-visible {
    outline: 3px solid rgba(59, 130, 246, 0.35);
    outline-offset: 0.3rem;
    border-radius: 1rem;
  }

  &:hover:not(:disabled) ${SeatVisual} {
    transform: scale(1.04);
  }

  ${props => props.$state === SeatState.SELECTED && css`
    filter: drop-shadow(0 12px 18px rgba(34, 197, 94, 0.16));
  `}

  ${props => props.$state === SeatState.OCCUPIED && css`
    opacity: 0.94;
  `}

  ${props => props.$state === SeatState.DRIVER && css`
    opacity: 0.98;
  `}

  ${props => !props.$interactive && css`
    cursor: default;
  `}

  ${props => props.$interactive && props.$state === SeatState.FREE && css`
    &:hover:not(:disabled) {
      filter: drop-shadow(0 10px 18px rgba(59, 130, 246, 0.16));
    }
  `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.84;
  }
`;

const SeatNumber = styled.span`
  position: absolute;
  top: 59%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 1.3rem;
  padding: 0.08rem 0.35rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 700;
  font-size: 0.64rem;
  line-height: 1.2;
  color: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  pointer-events: none;

  html.dark & {
    background: rgba(2, 6, 23, 0.88);
    border: 1px solid rgba(148, 163, 184, 0.28);
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      background: rgba(2, 6, 23, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.28);
    }
  }
`;

const DriverBadge = styled.span`
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
  border: 1px solid rgba(120, 53, 15, 0.12);
  color: #7c2d12;
  font-size: 0.55rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 18px rgba(245, 158, 11, 0.2);
  pointer-events: none;
`;

const Legend = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.75rem, 1fr));
  gap: 0.75rem;
  width: 100%;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.7);
  color: #334155;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);

  html.dark & {
    border: 1px solid rgba(71, 85, 105, 0.48);
    background: rgba(15, 23, 42, 0.58);
    color: #e2e8f0;
    box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.12);
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      border: 1px solid rgba(71, 85, 105, 0.48);
      background: rgba(15, 23, 42, 0.58);
      color: #e2e8f0;
      box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.12);
    }
  }
`;

const LegendSwatch = styled.img<{ $state: SeatStateType }>`
  width: 1rem;
  height: 1rem;
  object-fit: contain;
  flex: 0 0 auto;
  filter: ${props => seatFilters[props.$state]};
`;

const LegendText = styled.span`
  font-size: 0.84rem;
  line-height: 1.35;
  font-weight: 600;
`;

const LegendHint = styled.p`
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #64748b;
  text-align: center;

  html.dark & {
    color: #94a3b8;
  }

  @media (prefers-color-scheme: dark) {
    html:not(.light) & {
      color: #94a3b8;
    }
  }
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
        $layout={normalizedLayout}
        $top={seatPosition.top}
        $left={seatPosition.left}
        type="button"
        onClick={() => handleSeatClick(position)}
        disabled={!isInteractive || state === SeatState.OCCUPIED || state === SeatState.DRIVER}
        title={tooltipText}
        aria-label={ariaLabel}
        aria-pressed={state === SeatState.SELECTED}
      >
        <SeatVisual src={seatSvg} alt="" aria-hidden="true" $state={state} />
        {isDriver && <DriverBadge title="Řidič">D</DriverBadge>}
        <SeatNumber>{seat?.position_label || position}</SeatNumber>
      </SeatButton>
    );
  };

  // Render car with seats as overlay
  const renderCarWithSeats = () => {
    const { carSvgSrc, altText, maxSeats } = carMeta;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%' }}>
        <RendererHeader>
          <RendererTitle>{altText}</RendererTitle>
          <RendererSubtitle>
            {maxSeats} míst{mode === 'interactive' ? ' • vyberte volné sedadlo' : ' • přehled rozložení'}
          </RendererSubtitle>
        </RendererHeader>

        <CarStage>
          <CarFrame>
            <CarImage
              src={carSvgSrc}
              alt={`${altText} - pohled shora`}
            />
            <SeatOverlay>
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map(position => (
                <SeatComponent key={position} position={position} />
              ))}
            </SeatOverlay>
          </CarFrame>
        </CarStage>
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
        <Legend aria-label="Legenda stavů sedadel">
          <LegendItem>
            <LegendSwatch src={seatSvg} alt="" aria-hidden="true" $state={SeatState.DRIVER} />
            <LegendText>Řidič</LegendText>
          </LegendItem>
          <LegendItem>
            <LegendSwatch src={seatSvg} alt="" aria-hidden="true" $state={SeatState.FREE} />
            <LegendText>Volné</LegendText>
          </LegendItem>
          <LegendItem>
            <LegendSwatch src={seatSvg} alt="" aria-hidden="true" $state={SeatState.SELECTED} />
            <LegendText>Vybrané</LegendText>
          </LegendItem>
          <LegendItem>
            <LegendSwatch src={seatSvg} alt="" aria-hidden="true" $state={SeatState.OCCUPIED} />
            <LegendText>Obsazené</LegendText>
          </LegendItem>
        </Legend>
      )}

      {mode === 'interactive' && (
        <LegendHint>Volná sedadla jsou klikací. Řidič je vždy uzamčený a nelze jej vybrat.</LegendHint>
      )}
    </SeatRendererContainer>
  );
};

export default SeatRenderer;
