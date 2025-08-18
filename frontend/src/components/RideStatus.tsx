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
    if (Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60) < 2)
    {
        return { label: 'Jízda právě probíhá', color: 'yellow' };
    }
    else if (Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60 / 24) < 1)
    {
        return { label: 'Jízda proběhla před ' + Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60) + ' hodinami', color: 'red' };
    }
    else if (Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60 / 24) === 1)
    {
        return { label: 'Jízda proběhla před ' + Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60 / 24) + ' dnem', color: 'red' };
    }
    else
    {
        return { label: 'Jízda proběhla před ' + Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60 / 24) + ' dny', color: 'red' };
    }
  }
  else
  {
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
