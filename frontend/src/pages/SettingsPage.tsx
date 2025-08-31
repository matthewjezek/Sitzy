import { FiUser } from "react-icons/fi";

export default function SettingsPage() {
  return(
    <div className="page-container">
      <div className="page-content">
        <div className="main-card">
          <div className="main-card-header">
            <h1>Nastavení</h1>
          </div>
          <div className="main-card-body">
            <div className="settings-section">
              <div className="settings-section-header">
                <FiUser size={20} className="text-indigo-500" />
                <h2 className="settings-section-title">Profil</h2>
              </div>
              {/* Settings content */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}