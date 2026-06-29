import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import sedanSvg from '../assets/sedan.svg';
import coupeSvg from '../assets/coupe.svg';
import minivanSvg from '../assets/minivan.svg';
import seatSvg from '../assets/seat.svg';

export interface SeatData {
  position: number;
  position_label?: string;
  user_name?: string;
  occupied?: boolean;
  avatar_url?: string;
}

export interface SeatRendererProps {
  layout: 'SEDAQ' | 'TRAPAQ' | 'PRAQ' | string;
  seats: SeatData[];
  selectedSeat?: number | null;
  onSeatSelect?: (position: number | null) => void;
  ownerName?: string;
  driverAvatarUrl?: string | null;
  mode: 'interactive' | 'display';
  className?: string;
  orientation?: 'portrait' | 'landscape';
  showHeader?: boolean;
  showLegend?: boolean;
  compact?: boolean;
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
const SeatRendererContainer = styled.section<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: ${props => props.$compact ? 'center' : 'flex-start'};
  height: ${props => props.$compact ? '100%' : 'auto'};
  
  gap: ${props => props.$compact ? '0.5rem' : '1.5rem'};
  width: 100%;
  padding: ${props => props.$compact ? '0' : 'clamp(1rem, 3vw, 2.5rem)'};
  font-size: ${props => props.$compact ? '0.85rem' : '1.2rem'};
  border-radius: 1.5rem;
  
  border: ${props => props.$compact ? 'none' : '1px solid rgba(148, 163, 184, 0.18)'};
  background: ${props => props.$compact ? 'transparent' : 'radial-gradient(circle at top, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92) 48%, rgba(241, 245, 249, 0.88) 100%)'};
  box-shadow: ${props => props.$compact ? 'none' : '0 24px 70px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)'};

  html.dark & {
    border: ${props => props.$compact ? 'none' : '1px solid rgba(71, 85, 105, 0.45)'};
    background: ${props => props.$compact ? 'transparent' : 'radial-gradient(circle at top, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.94) 52%, rgba(2, 6, 23, 0.94) 100%)'};
    box-shadow: ${props => props.$compact ? 'none' : '0 28px 80px rgba(2, 6, 23, 0.55), inset 0 1px 0 rgba(148, 163, 184, 0.18)'};
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
  font-size: 1.15rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;
  html.dark & { color: #f8fafc; }
`;

const RendererSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #64748b;
  html.dark & { color: #94a3b8; }
`;

const skeletonShimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonBlock = styled.div<{ $radius?: string; $height: string; $width?: string }>`
  width: ${props => props.$width ?? '100%'};
  height: ${props => props.$height};
  border-radius: ${props => props.$radius ?? '0.75rem'};
  background: linear-gradient(
    90deg,
    rgba(203, 213, 225, 0.42) 0%,
    rgba(226, 232, 240, 0.72) 35%,
    rgba(203, 213, 225, 0.42) 70%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1.35s ease-in-out infinite;
  html.dark & {
    background: linear-gradient(
      90deg,
      rgba(51, 65, 85, 0.52) 0%,
      rgba(71, 85, 105, 0.78) 35%,
      rgba(51, 65, 85, 0.52) 70%
    );
    background-size: 200% 100%;
  }
`;

const SkeletonHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const SkeletonCarShell = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 2.2;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.52);
  padding: clamp(0.75rem, 1.8vw, 1rem);
  html.dark & {
    border: 1px solid rgba(71, 85, 105, 0.45);
    background: rgba(15, 23, 42, 0.6);
  }
`;

const SkeletonLegend = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.75rem, 1fr));
  gap: 0.75rem;
`;

type SeatOrientation = 'portrait' | 'landscape';

const CarStage = styled.div<{ $orientation: SeatOrientation; $compact?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: ${props => {
    if (props.$compact) return '100%';
    if (props.$orientation === 'landscape') return 'clamp(18rem, 35vw, 28rem)';
    return 'auto';
  }};
  min-height: ${props => {
    if (props.$compact) return 'auto';
    if (props.$orientation === 'landscape') return '18rem';
    return 'auto';
  }};
`;

const CarFrame = styled.div<{ $orientation: SeatOrientation; $compact?: boolean }>`
  position: ${props => props.$orientation === 'landscape' ? 'absolute' : 'relative'};
  
  width: ${props => {
    if (props.$compact) return props.$orientation === 'landscape' ? '7.5rem' : '6.5rem';
    return props.$orientation === 'landscape' 
      ? 'min(clamp(16rem, 35vw, 26rem), 42vw)' 
      : 'min(100%, 28rem)';
  }};
  height: auto;
  
  padding: ${props => {
    if (props.$compact) return '0.25rem';
    return props.$orientation === 'landscape' ? 'clamp(0.5rem, 1vw, 1rem)' : 'clamp(1rem, 2vw, 1.5rem)';
  }};
  
  border-radius: 1.5rem;
  
  border: ${props => props.$compact ? 'none' : '1px solid rgba(148, 163, 184, 0.18)'};
  background: ${props => props.$compact ? 'transparent' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(241, 245, 249, 0.86))'};
  box-shadow: ${props => props.$compact ? 'none' : 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 12px 30px rgba(15, 23, 42, 0.06)'};
  
  overflow: hidden;
  transform: ${props => props.$orientation === 'landscape' ? 'rotate(-90deg)' : 'none'};
  transform-origin: center center;

  ${props => !props.$compact && css`
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
  `}

  html.dark & {
    border: ${props => props.$compact ? 'none' : '1px solid rgba(71, 85, 105, 0.45)'};
    background: ${props => props.$compact ? 'transparent' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.92))'};
    box-shadow: ${props => props.$compact ? 'none' : 'inset 0 1px 0 rgba(148, 163, 184, 0.18), 0 14px 36px rgba(2, 6, 23, 0.5)'};

    ${props => !props.$compact && css`
      &::before {
        background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.07) 35%, rgba(2, 6, 23, 0) 72%);
      }
    `}
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
  clip-path: inset(17% 0 12% 0);
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
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
  cursor: ${props => props.$interactive && props.$state !== SeatState.OCCUPIED && props.$state !== SeatState.DRIVER ? 'pointer' : 'default'};
  z-index: ${props => props.$state === SeatState.SELECTED ? 4 : props.$state === SeatState.OCCUPIED ? 3 : 2};

  &:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.04); }
  &:focus-visible { outline: 3px solid rgba(59, 130, 246, 0.35); outline-offset: 0.3rem; border-radius: 1rem; }
  &:hover:not(:disabled) ${SeatVisual} { transform: scale(1.04); }
  &:disabled { cursor: not-allowed; opacity: 0.84; }

  ${props => props.$interactive && css`
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: max(44px, 100%);
      height: max(44px, 100%);
      min-width: 44px;
      min-height: 44px;
    }
  `}
`;

const SeatNumber = styled.span<{ $orientation: SeatOrientation }>`
  position: absolute;
  top: 59%;
  left: 50%;
  transform: ${props => props.$orientation === 'landscape'
    ? 'translateX(-50%) rotate(90deg)'
    : 'translateX(-50%)'};
  min-width: 1.3em;
  padding: 0.1em 0.4em;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 700;
  font-size: 0.65em;
  line-height: 1.2;
  color: #fff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
  pointer-events: none;
  z-index: 5;

  html.dark & {
    background: rgba(2, 6, 23, 0.88);
    border: 1px solid rgba(148, 163, 184, 0.28);
  }
`;

const OccupantAvatar = styled.div<{ $isDriver?: boolean; $orientation: SeatOrientation; $compact?: boolean }>`
  position: absolute;
  top: 38%;
  left: 50%;
  transform: ${props => props.$orientation === 'landscape'
    ? 'translateX(-50%) rotate(90deg)'
    : 'translateX(-50%)'};
  width: ${props => props.$compact ? '1.4rem' : '2.2rem'};
  height: ${props => props.$compact ? '1.4rem' : '2.2rem'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--color-avatar-bg, #6366f1);
  color: white;
  font-weight: 700;
  font-size: ${props => props.$compact ? '0.55rem' : '0.85rem'};
  border: ${props => props.$compact ? '1px' : '2px'} solid ${props => props.$isDriver ? 'var(--color-driver, #f59e0b)' : 'var(--color-passenger, #3b82f6)'};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), ${props => props.$isDriver ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none'};
  z-index: 6;
  pointer-events: none;
  user-select: none;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  span {
    line-height: 1;
    display: inline-block;
  }
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
  html.dark & { color: #94a3b8; }
`;

const Attribution = styled.div`
  font-size: 0.65rem;
  color: #94a3b8;
  text-align: center;
  margin-top: 0.5rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  a {
    color: inherit;
    text-decoration: underline;
    &:hover {
      color: #6366f1;
    }
  }

  html.dark & {
    color: #475569;
    a:hover {
      color: #818cf8;
    }
  }
`;

export const SeatRenderer: React.FC<SeatRendererProps> = ({
  layout,
  seats,
  selectedSeat,
  onSeatSelect,
  ownerName = 'Řidič',
  driverAvatarUrl = null,
  mode = 'interactive',
  className = '',
  orientation = 'portrait',
  showHeader = true,
  showLegend,
  compact = false,
}) => {
  const normalizedLayout = layout.toLowerCase();
  
  const carMeta = React.useMemo(() => {
    switch (normalizedLayout) {
      case 'sedaq':
      case 'sedan (4 seats)': return { carSvgSrc: sedanSvg, altText: 'Sedan', maxSeats: 4 };
      case 'trapaq':
      case 'coupé (2 seats)': return { carSvgSrc: coupeSvg, altText: 'Kupé', maxSeats: 2 };
      case 'praq':
      case 'minivan (7 seats)': return { carSvgSrc: minivanSvg, altText: 'Minivan', maxSeats: 7 };
      default: return { carSvgSrc: sedanSvg, altText: 'Vozidlo', maxSeats: 4 };
    }
  }, [normalizedLayout]);

  const [carLoaded, setCarLoaded] = React.useState(false);
  const [seatLoaded, setSeatLoaded] = React.useState(false);

  React.useEffect(() => {
    let canceled = false;
    setCarLoaded(false);
    const imgCar = new Image();
    imgCar.onload = () => { if (!canceled) setCarLoaded(true); };
    imgCar.onerror = () => { if (!canceled) setCarLoaded(true); };
    imgCar.src = carMeta.carSvgSrc;
    if (!seatLoaded) {
      const imgSeat = new Image();
      imgSeat.onload = () => { if (!canceled) setSeatLoaded(true); };
      imgSeat.onerror = () => { if (!canceled) setSeatLoaded(true); };
      imgSeat.src = seatSvg;
    }
    return () => { canceled = true; };
  }, [carMeta.carSvgSrc, seatLoaded]);
  
  const seatByPosition = React.useMemo(() => {
    const map: Record<number, SeatData> = {};
    seats.forEach(seat => { map[seat.position] = seat; });
    return map;
  }, [seats]);

  const getSeatState = (position: number): SeatStateType => {
    if (position === 1) return SeatState.DRIVER;
    const seat = seatByPosition[position];
    if (seat?.occupied || seat?.user_name) return SeatState.OCCUPIED;
    if (selectedSeat === position) return SeatState.SELECTED;
    return SeatState.FREE;
  };

  const getSeatPosition = (position: number): { top: number; left: number } => {
    switch (normalizedLayout) {
      case 'sedaq':
      case 'sedan (4 seats)':
        switch (position) {
          case 1: return { top: 47, left: 34 };
          case 2: return { top: 47, left: 64 };
          case 3: return { top: 70, left: 34 };
          case 4: return { top: 70, left: 64 };
          default: return { top: 50, left: 50 };
        }
      case 'trapaq':
      case 'coupé (2 seats)':
        switch (position) {
          case 1: return { top: 57, left: 33 };
          case 2: return { top: 57, left: 67 };
          default: return { top: 57, left: 50 };
        }
      case 'praq':
      case 'minivan (7 seats)':
        switch (position) {
          case 1: return { top: 44, left: 35 };
          case 2: return { top: 44, left: 65 };
          case 3: return { top: 64, left: 25 };
          case 4: return { top: 64, left: 50 };
          case 5: return { top: 64, left: 75 };
          case 6: return { top: 84, left: 35 };
          case 7: return { top: 84, left: 65 };
          default: return { top: 50, left: 50 };
        }
      default: return { top: 50, left: 50 };
    }
  };

  const handleSeatClick = (position: number) => {
    if (mode !== 'interactive' || !onSeatSelect) return;
    const state = getSeatState(position);
    if (state === SeatState.OCCUPIED || state === SeatState.DRIVER) return;
    onSeatSelect(selectedSeat === position ? null : position);
  };

  const SeatComponent: React.FC<{ position: number }> = ({ position }) => {
    const seat = seatByPosition[position];
    const state = getSeatState(position);
    const isInteractive = mode === 'interactive';
    const isDriver = position === 1;
    const seatPosition = getSeatPosition(position);

    const tooltipText = isDriver 
      ? `Řidič: ${ownerName} - nedostupné` 
      : state === SeatState.OCCUPIED 
        ? (seat?.user_name ? `Obsazeno: ${seat.user_name}` : 'Obsazeno')
        : state === SeatState.SELECTED
          ? 'Vaše vybrané sedadlo'
          : isInteractive ? 'Volné sedadlo - klikněte pro výběr' : 'Volné sedadlo';

    const ariaLabel = isDriver 
      ? `Řidič: ${ownerName}, sedadlo nedostupné` 
      : state === SeatState.OCCUPIED
        ? (seat?.user_name ? `Obsazeno: ${seat.user_name}` : 'Obsazené sedadlo')
        : state === SeatState.SELECTED
          ? 'Vaše vybrané sedadlo'
          : isInteractive ? 'Volné sedadlo, klikněte pro výběr' : 'Volné sedadlo';

    const isOccupied = state === SeatState.OCCUPIED || isDriver;
    const occupantAvatar = isDriver ? driverAvatarUrl : seat?.avatar_url;
    const occupantInitials = isDriver 
      ? (ownerName?.[0]?.toUpperCase() ?? 'Ř') 
      : (seat?.user_name?.[0]?.toUpperCase() ?? 'P');

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
      >
        <SeatVisual src={seatSvg} alt="" aria-hidden="true" $state={state} />
        {isOccupied && (
          <OccupantAvatar $isDriver={isDriver} $orientation={orientation} $compact={compact}>
            {occupantAvatar ? (
              <img src={occupantAvatar} alt="" crossOrigin="anonymous" />
            ) : (
              <span>{occupantInitials}</span>
            )}
          </OccupantAvatar>
        )}
        {!compact && <SeatNumber $orientation={orientation}>{seat?.position_label || position}</SeatNumber>}
      </SeatButton>
    );
  };

  const renderLegend = showLegend ?? mode === 'interactive';

  const renderCarWithSeats = () => {
    const { carSvgSrc, altText, maxSeats } = carMeta;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%', height: compact ? '100%' : 'auto' }}>
        {showHeader && (
          <RendererHeader>
            <RendererTitle>{altText}</RendererTitle>
            <RendererSubtitle>
              {maxSeats} míst{mode === 'interactive' ? ' • vyberte volné sedadlo' : ' • přehled rozložení'}
            </RendererSubtitle>
          </RendererHeader>
        )}
        <CarStage $orientation={orientation} $compact={compact}>
          <CarFrame $orientation={orientation} $compact={compact}>
            <CarImage src={carSvgSrc} alt={`${altText} - pohled shora`} />
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

  const renderSkeleton = () => (
    <>
      {showHeader && (
        <SkeletonHeader aria-hidden="true">
          <SkeletonBlock $height="1.15rem" $width="7.5rem" $radius="999px" />
          <SkeletonBlock $height="0.9rem" $width="12.5rem" $radius="999px" />
        </SkeletonHeader>
      )}

      <CarStage aria-hidden="true" $orientation={orientation} $compact={compact}>
        <CarFrame $orientation={orientation} $compact={compact}>
          <SkeletonCarShell>
            <SkeletonBlock $height="100%" $radius="1rem" />
          </SkeletonCarShell>
        </CarFrame>
      </CarStage>

      {renderLegend && mode === 'interactive' && (
        <SkeletonLegend aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={`skeleton-legend-${index}`} $height="3.2rem" $radius="1.15rem" />
          ))}
        </SkeletonLegend>
      )}
    </>
  );

  if (!ready) {
    return (
      <SeatRendererContainer className={className} $compact={compact}>
        {renderSkeleton()}
      </SeatRendererContainer>
    );
  }

  return (
    <SeatRendererContainer className={className} $compact={compact}>
      {renderCarWithSeats()}
      {renderLegend && mode === 'interactive' && (
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
      {renderLegend && mode === 'interactive' && (
        <LegendHint>Volná sedadla jsou klikací. Řidič je vždy uzamčený a nelze jej vybrat.</LegendHint>
      )}
      {!compact && (
        <Attribution>
          Designed by <a href="https://www.magnific.com" target="_blank" rel="noopener noreferrer">Magnific</a>
        </Attribution>
      )}
    </SeatRendererContainer>
  );
};

export default SeatRenderer;