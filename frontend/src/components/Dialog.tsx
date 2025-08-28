import { forwardRef } from "react";

const MyDialog = forwardRef<HTMLDialogElement, { children: React.ReactNode; toggle: () => void; }>((props, ref) => {
  const { children, toggle } = props;
  return (
    <dialog 
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

export default MyDialog;