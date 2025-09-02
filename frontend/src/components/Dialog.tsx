import { forwardRef, useState } from "react";
import { FiBell, FiMail, FiCheck, FiX, FiClock } from "react-icons/fi";

const DeleteDialog = forwardRef<HTMLDialogElement, { children: React.ReactNode; toggle: () => void; action: () => Promise<void>; }>((props, ref) => {
  const { children, toggle, action } = props;
  return (
    <dialog
      className="dialog-card"
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          toggle();
        }
      }}
    >
      <div className="dialog-header">
        <div className="dialog-danger-image">
          <svg aria-hidden="true" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div className="dialog-content">
          {children}
        </div>
        <div className="dialog-actions">
          <button className="dialog-proceed-danger-button" onClick={action}>
            Smazat
          </button>
          <button className="cancel-button" onClick={toggle}>
            Zrušit
          </button>
        </div>
      </div>
    </dialog>
  );
});

const WarningDialog = forwardRef<HTMLDialogElement, { children: React.ReactNode; toggle: () => void; }>((props, ref) => {
  const { children, toggle } = props;
  return (
    <dialog
      className="dialog-card"
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          toggle();
        }
      }}
    >
      <div className="dialog-header">
        <div className="dialog-warning-image">
          <svg aria-hidden="true" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div className="dialog-content">
          {children}
        </div>
        <div className="dialog-actions">
          <button className="cancel-button" onClick={toggle}>
            Zavřít
          </button>
        </div>
      </div>
    </dialog>
  );
});

const SuccessDialog = forwardRef<HTMLDialogElement, { children: React.ReactNode; toggle: () => void; }>((props, ref) => {
  const { children, toggle } = props;
  return (
    <dialog
      className="dialog-card"
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          toggle();
        }
      }}
    >
      <div className="dialog-header">
        <div className="dialog-success-image">
          <svg viewBox="0 0 24 24" fill="none"stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7L9.00004 18L3.99994 13" />
          </svg>
        </div>
        {children}
        <div className="dialog-content">
          <button className="cancel-button" onClick={toggle}>Zrušit</button>
        </div>
      </div>
    </dialog>
  );
});

const MyDialog = forwardRef<HTMLDialogElement, { children: React.ReactNode; toggle: () => void; }>((props, ref) => {
  const { children, toggle } = props;
  return (
    <dialog
      className="dialog-card"
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          toggle();
        }
      }}
    >
      <div>
        {children}
        <button onClick={toggle}>Close</button>
      </div>
    </dialog>
  );
});

// Typy pro InviteDialog
type InviteInvitation = {
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: Date;
  token: string;
};

type InviteDialogProps = {
  toggle: () => void;
  pendingInvites: InviteInvitation[];
  onInvite: (email: string) => void;
  onCancel: (inviteToken: string) => void;
  loading: boolean;
};

// Dialog pro pozvání uživatelů
const InviteDialog = forwardRef<HTMLDialogElement, InviteDialogProps>(
  ({ toggle, pendingInvites, onInvite, onCancel, loading }, ref) => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onInvite(email);
      setEmail("");
      setError(null);
    };

    return (
      <dialog className="dialog-card" ref={ref}>
        <div className="dialog-header">
          <div className="flex flex-row-reverse justify-between m-0">
            <div
              className="w-auto m-0 p-1 text-gray-700 hover:bg-gray-200 cursor-pointer rounded"
              onClick={toggle}
            >
              <FiX className="text-2xl md:text-lg" />
            </div>
            <div className="dialog-title text-xl">
              <h1>Pozvat uživatele</h1>
            </div>
          </div>

          <div className="dialog-content">
            <form className="form-container" onSubmit={handleSubmit}>
              <div className="form-group !mb-0.5 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="E-mail uživatele"
                  className="form-input !px-4 !py-2"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.toLocaleLowerCase());
                    setError(null);
                  }}
                  required
                />
                <button 
                  type="submit"
                  className="primary-button !px-4 !py-2"
                  disabled={loading}
                >
                  Pozvat
                </button>
              </div>
              {error && (
                <div className="form-group flex flex-row !mb-0.5">
                  <span className="text-md text-red-500">{error}</span>
                </div>
              )}
            </form>

            <hr className="border-gray-300 my-4" />

            <div className="flex flex-col gap-2">
              <h2 className="dialog-title flex items-start">Čekající pozvánky</h2>
              <div className="flex flex-col gap-2">
                {loading ? (
                  <p className="text-gray-500 text-sm">Načítání...</p>
                ) : pendingInvites.length === 0 ? (
                  <p className="text-gray-500 text-sm">Žádné čekající pozvánky</p>
                ) : (
                  pendingInvites.map((invite) => (
                    <div
                      key={invite.token}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span>{invite.email}</span>
                      {invite.status === "PENDING" && (
                        <button
                          className="text-red-500 text-sm hover:underline"
                          onClick={() => onCancel(invite.token)}
                        >
                          Zrušit
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dialog-actions flex flex-row justify-end m-0">
            <button
              className="cancel-button w-auto px-4 py-2 text-sm"
              onClick={toggle}
            >
              Zavřít
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);

// Typy pro notifikace
type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: Date;
  read: boolean;
};

type NotificationDialogProps = {
  toggle: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
};

// Dialog pro notifikace
const NotificationDialog = forwardRef<HTMLDialogElement, NotificationDialogProps>(
  ({ toggle, notifications, onMarkAsRead, onMarkAllAsRead }, ref) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <dialog className="dialog-card !max-w-md" ref={ref}>
        <div className="dialog-header">
          <div className="flex flex-row-reverse justify-between m-0">
            <div
              className="w-auto m-0 p-1 text-gray-700 hover:bg-gray-200 cursor-pointer rounded"
              onClick={toggle}
            >
              <FiX className="text-2xl md:text-lg" />
            </div>
            <div className="dialog-title text-xl flex items-center gap-2">
              <FiBell className="text-indigo-500" />
              <h1>Notifikace</h1>
              {unreadCount > 0 && (
                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="dialog-content">
            {notifications.length === 0 ? (
              <div className="empty-state !p-4">
                <div className="empty-state-icon !w-12 !h-12">
                  <FiBell size={24} />
                </div>
                <p className="empty-state-title !text-lg">Žádné notifikace</p>
                <p className="empty-state-description !mb-0">
                  Zatím nemáte žádné nové notifikace
                </p>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div className="mb-4">
                    <button
                      className="tertiary-button !text-sm !px-3 !py-1"
                      onClick={onMarkAllAsRead}
                    >
                      Označit vše jako přečtené
                    </button>
                  </div>
                )}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        notification.read
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-indigo-50 border-indigo-200'
                      }`}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded-full ${
                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {notification.type === 'success' ? <FiCheck size={14} /> :
                           notification.type === 'warning' ? <FiClock size={14} /> :
                           notification.type === 'error' ? <FiX size={14} /> :
                           <FiBell size={14} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-gray-600 text-xs mt-1">
                            {notification.message}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {notification.created_at.toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="dialog-actions flex flex-row justify-end m-0">
            <button className="cancel-button w-auto px-4 py-2 text-sm" onClick={toggle}>
              Zavřít
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);

// Typy pro pozvánky
type Invitation = {
  id: string;
  carName: string;
  ownerName: string;
  date: string;
  token: string;
};

type InvitationDialogProps = {
  toggle: () => void;
  invitation: Invitation;
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
  loading: boolean;
};

// Dialog pro přijmutí/odmítnutí pozvánky
const InvitationDialog = forwardRef<HTMLDialogElement, InvitationDialogProps>(
  ({ toggle, invitation, onAccept, onDecline, loading }, ref) => {
    return (
      <dialog className="dialog-card !max-w-sm" ref={ref}>
        <div className="dialog-header">
          <div className="flex flex-row-reverse justify-between m-0">
            <div
              className="w-auto m-0 p-1 text-gray-700 hover:bg-gray-200 cursor-pointer rounded"
              onClick={toggle}
            >
              <FiX className="text-2xl md:text-lg" />
            </div>
            <div className="dialog-title text-xl flex items-center gap-2">
              <FiMail className="text-indigo-500" />
              <h1>Pozvánka na jízdu</h1>
            </div>
          </div>

          <div className="dialog-content">
            <div className="info-card !p-4 !mb-4">
              <div className="info-card-header !mb-3">
                <div className="info-card-icon !p-2">
                  <svg
                    className="w-5 h-5"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="10" width="20" height="9" rx="2" />
                    <path d="m20.772 10.156-1.368-4.105A2.995 2.995 0 0 0 16.559 4H7.441a2.995 2.995 0 0 0-2.845 2.051l-1.368 4.105A2.003" />
                    <circle cx="6" cy="14.5" r="1.5" />
                    <circle cx="18" cy="14.5" r="1.5" />
                  </svg>
                </div>
                <h3 className="info-card-title !text-base">{invitation.carName}</h3>
              </div>
              <div className="info-card-content space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Řidič:</span>
                  <span className="font-medium">{invitation.ownerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Datum:</span>
                  <span className="font-medium">
                    {new Date(invitation.date).toLocaleDateString('cs-CZ', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="dialog-message !mb-4">
              <p className="text-gray-600 text-center">
                Chcete se zúčastnit této jízdy?
              </p>
            </div>
          </div>

          <div className="dialog-actions button-group !flex-row justify-center gap-3 m-0">
            <button
              className="secondary-button !px-4 !py-2"
              onClick={() => onDecline(invitation.token)}
              disabled={loading}
            >
              <FiX size={16} />
              Odmítnout
            </button>
            <button
              className="primary-button !px-4 !py-2"
              onClick={() => onAccept(invitation.token)}
              disabled={loading}
            >
              <FiCheck size={16} />
              Přijmout
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);

NotificationDialog.displayName = "NotificationDialog";
InvitationDialog.displayName = "InvitationDialog";
InviteDialog.displayName = "InviteDialog";

export { DeleteDialog, WarningDialog, SuccessDialog, MyDialog, InviteDialog, NotificationDialog, InvitationDialog };