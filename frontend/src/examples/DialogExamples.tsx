import { useRef, useState } from 'react';
import { NotificationDialog, InvitationDialog } from '../components/Dialog';

// Ukázka použití nových dialogů
export default function DialogExamples() {
  const notificationDialogRef = useRef<HTMLDialogElement | null>(null);
  const invitationDialogRef = useRef<HTMLDialogElement | null>(null);

  // Mock data pro notifikace
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Nová pozvánka',
      message: 'Jan Novák vás pozval na jízdu do Prahy',
      type: 'info' as const,
      created_at: new Date(),
      read: false
    },
    {
      id: '2',
      title: 'Jízda zrušena',
      message: 'Jízda "Praha - Brno" byla zrušena organizátorem',
      type: 'warning' as const,
      created_at: new Date(Date.now() - 86400000), // včera
      read: true
    }
  ]);

  // Mock data pro pozvánku
  const mockInvitation = {
    id: '1',
    carName: 'Rychlík do Prahy',
    ownerName: 'Jan Novák',
    date: '2025-09-03T14:30:00',
    token: 'abc123'
  };

  const toggleNotificationDialog = () => {
    if (!notificationDialogRef.current) return;
    if (notificationDialogRef.current.hasAttribute('open')) {
      notificationDialogRef.current.close();
    } else {
      notificationDialogRef.current.showModal();
    }
  };

  const toggleInvitationDialog = () => {
    if (!invitationDialogRef.current) return;
    if (invitationDialogRef.current.hasAttribute('open')) {
      invitationDialogRef.current.close();
    } else {
      invitationDialogRef.current.showModal();
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleAcceptInvitation = (token: string) => {
    console.log('Přijmutí pozvánky:', token);
    toggleInvitationDialog();
  };

  const handleDeclineInvitation = (token: string) => {
    console.log('Odmítnutí pozvánky:', token);
    toggleInvitationDialog();
  };

  return (
    <div className="page-container">
      <div className="page-content max-w-md">
        <div className="main-card">
          <div className="main-card-header">
            <h1>Ukázka dialogů</h1>
          </div>
          <div className="main-card-body space-y-4">
            <button 
              className="primary-button w-full"
              onClick={toggleNotificationDialog}
            >
              Otevřít notifikace
            </button>
            
            <button 
              className="secondary-button w-full"
              onClick={toggleInvitationDialog}
            >
              Otevřít pozvánku
            </button>
          </div>
        </div>
      </div>

      {/* Dialogy */}
      <NotificationDialog
        ref={notificationDialogRef}
        toggle={toggleNotificationDialog}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      <InvitationDialog
        ref={invitationDialogRef}
        toggle={toggleInvitationDialog}
        invitation={mockInvitation}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        loading={false}
      />
    </div>
  );
}
