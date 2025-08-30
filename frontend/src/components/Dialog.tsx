import { forwardRef } from "react";

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

export { DeleteDialog, WarningDialog, SuccessDialog, MyDialog };