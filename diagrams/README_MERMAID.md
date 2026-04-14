# 📊 Sitzy - Mermaid Diagramy

Všechny diagramy jsou ve formátu **Mermaid**, který je nativně podporovaný v:

- GitHub
- GitLab
- VS Code (s extensions)
- Notion
- Obsidian
- a mnoho dalších nástrojů

## 📁 Soubory

| Soubor | Obsah |
| ------ | ----- |
| [01_usecase.md](01_usecase.md) | Use Case Diagram - Role Řidiče a Pasažéra |
| [02_er.md](02_er.md) | ER Diagram - Aktuální architektura (OAuth + více aut) |
| [03_sequence_oauth.md](03_sequence_oauth.md) | Sequence Diagram - OAuth Login Flow |
| [04_sequence_multiple_cars.md](04_sequence_multiple_cars.md) | Sequence Diagram - Více aut a přenos řidiče |
| [05_class_diagram.md](05_class_diagram.md) | Class Diagram - Python SQLAlchemy Modely |
| [06_state_invitation_lifecycle.md](06_state_invitation_lifecycle.md) | State Diagram - Lifecycle pozvánky a účasti |
| [07_sequence_auth_session_lifecycle.md](07_sequence_auth_session_lifecycle.md) | Sequence Diagram - Access/refresh session lifecycle |

---

## 📋 Obsah Diagramů

### 1️⃣ Use Case Diagram

- **Role**: Řidič vs. Pasažér
- **Interakce**: Registrace, přihlášení, vytvoření auta, pozvánky
- **Tok**: Majitel → Řidič → Pasažér

### 2️⃣ ER Diagram - Aktuální stav

- OAuth identity a session tabulky
- 1:N vztah User:Car
- Oddělení majitele a řidiče přes `CAR_DRIVERS`

### 3️⃣ ER Diagram - OAuth architektura ⭐

- **OAuth tabulky**: `SOCIAL_ACCOUNTS`, `SOCIAL_SESSIONS`
- **1:N User:Car** (více aut na uživatele)
- **Historie řidičů**: `CAR_DRIVERS` tabulka
- **Audit log**: `INTEGRATION_AUDIT_LOGS` pro události OAuth/integrací
- **Optimalizace**: Composite PKs, explicitní enum statusy

### 4️⃣ Sequence Diagram - OAuth

- Kompletní OAuth 2.0 flow
- Facebook/X integration
- JWT token generation
- Auto-registration nových uživatelů

### 5️⃣ Sequence Diagram - Multiple Cars

- Scénář: Alice (majitel) → Bob (řidič) → Charlie (pasažér)
- Přiřazení řidiče k autu
- Vytvoření jízdy
- Pozvání pasažérů

### 6️⃣ Class Diagram

- Python SQLAlchemy modely
- Vztahy mezi třídami
- Metody a atributy

### 7️⃣ State Diagram - Invitation Lifecycle

- Stav pozvánky od vytvoření po přijetí, zamítnutí, expiraci nebo smazání
- Přijetí vytváří `Passenger` záznam

### 8️⃣ Sequence Diagram - Auth Session Lifecycle

- OAuth login, access token, refresh cookie a revokace session
- Ověření každého requestu proti `SocialSession`

## ✅ Kontrolní seznam

- [x] Use Case diagram
- [x] ER diagram - aktuální stav
- [x] ER diagram - OAuth architektura
- [x] Sequence diagram - OAuth
- [x] Sequence diagram - Multiple cars
- [x] Class diagram
- [x] State diagram - Invitation lifecycle
- [x] Sequence diagram - Auth session lifecycle
- [x] README s instrukcemi

---

**Poslední aktualizace**: 15. dubna 2026

**Formát**: Mermaid (Markdown kompatibilní)
