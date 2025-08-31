import { forwardRef, useState } from "react";
import { FiX } from "react-icons/fi";

type Invitation = {
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: Date;
  token: string;
};

type InviteDialogProps = {
  toggle: () => void;
  pendingInvites: Invitation[];
  onInvite: (email: string) => void;
  onCancel: (inviteToken: string) => void;
  loading: boolean;
};

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
              className="w-auto m-0 p-1 text-gray-700 hover:bg-gray-200 cursor-pointer"
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

InviteDialog.displayName = "InviteDialog";
export default InviteDialog;
