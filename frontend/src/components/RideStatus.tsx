import React from 'react';

interface RideStatusProps {
  date?: string;
}

function getStatus(date?: string): { label: string; color: string } {
  if (!date) return { label: 'Neznámé datum', color: 'gray' };
  const rideDate = new Date(date);
  if (isNaN(rideDate.getTime())) return { label: 'Neplatné datum', color: 'gray' };
  const now = new Date();
  if (rideDate < now) {
    return { label: 'Jízda proběhla', color: 'red' };
  } else {
    return { label: 'Jízda čeká', color: 'green' };
  }
}

const RideStatus: React.FC<RideStatusProps> = ({ date }) => {
  const status = getStatus(date);
  return (
    <span style={{ color: status.color }}>
      {status.label}
    </span>
  );
};

export default RideStatus;
