import React from 'react';
import { FiClock, FiPlay, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface RideStatusProps {
  date?: string;
}

function getStatus(date?: string): { label: string; className: string; icon: React.ReactNode } {
  if (!date) return { 
    label: 'Neznámé datum', 
    className: 'ride-status ride-status-unknown',
    icon: <FiAlertCircle size={16} />
  };
  
  const rideDate = new Date(date);
  if (isNaN(rideDate.getTime())) return { 
    label: 'Neplatné datum', 
    className: 'ride-status ride-status-unknown',
    icon: <FiAlertCircle size={16} />
  };
  
  const now = new Date();
  
  if (rideDate < now) {
    const hoursAgo = Math.floor((now.getTime() - rideDate.getTime()) / 1000 / 60 / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    
    if (hoursAgo < 2) {
      return { 
        label: 'Jízda právě probíhá', 
        className: 'ride-status ride-status-ongoing',
        icon: <FiPlay size={16} />
      };
    } else if (daysAgo < 1) {
      return { 
        label: `Jízda proběhla před ${hoursAgo} hodinami`, 
        className: 'ride-status ride-status-completed',
        icon: <FiCheck size={16} />
      };
    } else if (daysAgo === 1) {
      return { 
        label: `Jízda proběhla před ${daysAgo} dnem`, 
        className: 'ride-status ride-status-completed',
        icon: <FiCheck size={16} />
      };
    } else {
      return { 
        label: `Jízda proběhla před ${daysAgo} dny`, 
        className: 'ride-status ride-status-completed',
        icon: <FiCheck size={16} />
      };
    }
  } else {
    return { 
      label: 'Jízda čeká', 
      className: 'ride-status ride-status-waiting',
      icon: <FiClock size={16} />
    };
  }
}

const RideStatus: React.FC<RideStatusProps> = ({ date }) => {
  const status = getStatus(date);
  return (
    <div className={status.className}>
      {status.icon}
      <span>{status.label}</span>
    </div>
  );
};

export default RideStatus;
