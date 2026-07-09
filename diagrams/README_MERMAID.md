# Sitzy - Mermaid Diagramy

Všechny diagramy jsou ve formátu **Mermaid**, který je nativně podporovaný v:

- GitHub
- GitLab
- VS Code (s extensions)
- Notion
- Obsidian
- a mnoho dalších nástrojů

## Soubory

| Soubor | Obsah |
| ------ | ----- |
| [01_usecase.md](01_usecase.md) | Use Case Diagram - Role Řidiče a Pasažéra |
| [02_er.md](02_er.md) / [02_er.drawio](02_er.drawio) | ER Diagram - Aktuální architektura (OAuth + více aut) |
| [03_sequence_oauth.md](03_sequence_oauth.md) | Sequence Diagram - OAuth Login Flow |
| [04_sequence_multiple_cars.md](04_sequence_multiple_cars.md) | Sequence Diagram - Více aut a přenos řidiče |
| [05_class_diagram.md](05_class_diagram.md) / [05_class_diagram.drawio](05_class_diagram.drawio) | Class Diagram - Python SQLAlchemy Modely |
| [06_state_invitation_lifecycle.md](06_state_invitation_lifecycle.md) | State Diagram - Lifecycle pozvánky a účasti |
| [07_sequence_auth_session_lifecycle.md](07_sequence_auth_session_lifecycle.md) | Sequence Diagram - Access/refresh session lifecycle |
| [08_sequence_driver_passenger.md](08_sequence_driver_passenger.md) | Sequence Diagram - Interakce Řidiče a Pasažéra (Rezervace) |
| [09_activity_driver_passenger.md](09_activity_driver_passenger.md) | Activity Diagram - Rezervace sedadla pasažérem |
| [10_sequence_oauth_x.md](10_sequence_oauth_x.md) | Sequence Diagram - OAuth Login Flow přes X (Twitter) |
| [11_er_auth_subset.md](11_er_auth_subset.md) | ER Diagram - Uživatelé a OAuth relace (výsek schématu) |
| [12_sequence_delegated_auth_pkce.md](12_sequence_delegated_auth_pkce.md) | Sequence Diagram - Delegovaná bezheslová autentizace s CSRF a PKCE |
| [13_erd_normalized.md](13_erd_normalized.md) | ER Diagram - Normalizované schéma databáze (kompletní) |
| [14_integration_architecture.md](14_integration_architecture.md) | Flowchart - Integrační architektura a technologické hranice |
| [15_component_diagram.md](15_component_diagram.md) | Flowchart - UML Komponentní diagram (React & FastAPI) |

---

## ⚡ Interaktivní Draw.io & Code Link Feature

Diagramy `02_er.drawio` a `05_class_diagram.drawio` jsou ve formátu **Draw.io**. 

Pokud používáte VS Code s rozšířením **Draw.io Integration** (od Henninga Dieterichse), můžete využít funkci **Code Link**:
1. Otevřete libovolný `.drawio` diagram ve VS Code.
2. V dolním stavovém řádku (Status Bar) klikněte na položku **Code Link** pro její aktivaci (tlačítko se zvýrazní).
3. **Poklepejte (double click)** na libovolný objekt třídy (který má popisek začínající znakem `#`, např. `#User`).
4. VS Code automaticky vyhledá odpovídající symbol v projektu a přesměruje vás přímo na definici SQLAlchemy modelu v souboru `api/models.py`.

> [!TIP]
> Pokud si otevřete Draw.io editor na pravé straně (do druhého sloupce editoru) a navigujete na symbol v kódu nalevo, diagram zůstane stále viditelný.

> [!IMPORTANT]
> Pro správné fungování vyhledávání symbolů musíte mít v editoru otevřený alespoň jeden soubor z daného projektu, aby VS Code mohl projekt indexovat.


---

## Obsah Diagramů

### Use Case Diagram

- **Role**: Řidič vs. Pasažér
- **Interakce**: Registrace, přihlášení, vytvoření auta, pozvánky
- **Tok**: Majitel → Řidič → Pasažér

### ER Diagram - Aktuální stav

- OAuth identity a session tabulky
- 1:N vztah User:Car
- Oddělení majitele a řidiče přes `CAR_DRIVERS`

### ER Diagram - OAuth architektura

- **OAuth tabulky**: `SOCIAL_ACCOUNTS`, `SOCIAL_SESSIONS`
- **1:N User:Car** (více aut na uživatele)
- **Historie řidičů**: `CAR_DRIVERS` tabulka
- **Audit log**: `INTEGRATION_AUDIT_LOGS` pro události OAuth/integrací
- **Optimalizace**: Composite PKs, explicitní enum statusy

### Sequence Diagram - OAuth

- Kompletní OAuth 2.0 flow
- Facebook/X integration
- JWT token generation
- Auto-registration nových uživatelů

### Sequence Diagram - Multiple Cars

- Scénář: Alice (majitel) → Bob (řidič) → Charlie (pasažér)
- Přiřazení řidiče k autu
- Vytvoření jízdy
- Pozvání pasažérů

### Class Diagram

- Python SQLAlchemy modely
- Vztahy mezi třídami
- Metody a atributy

### State Diagram - Invitation Lifecycle

- Stav pozvánky od vytvoření po přijetí, zamítnutí, expiraci nebo smazání
- Přijetí vytváří `Passenger` záznam

### Sequence Diagram - Auth Session Lifecycle

- OAuth login, access token, refresh cookie a revokace session
- Ověření každého requestu proti `SocialSession`

## Kontrolní seznam

- [x] Use Case diagram
- [x] ER diagram - aktuální stav
- [x] ER diagram - OAuth architektura
- [x] Sequence diagram - OAuth
- [x] Sequence diagram - Multiple cars
- [x] Class diagram
- [x] State diagram - Invitation lifecycle
- [x] Sequence diagram - Auth session lifecycle
- [x] Sequence diagram - Interakce Řidiče a Pasažéra
- [x] Activity diagram - Rezervace sedadla pasažérem
- [x] Sequence diagram - OAuth Login Flow přes X
- [x] ER diagram - Uživatelé a OAuth relace (výsek)
- [x] Sequence diagram - Delegovaná bezheslová autentizace s CSRF a PKCE
- [x] ER diagram - Normalizované schéma databáze
- [x] Flowchart - Integrační architektura a technologické hranice
- [x] UML Komponentní diagram (React & FastAPI)
- [x] README s instrukcemi

---

**Poslední aktualizace**: 30. června 2026

**Formát**: Mermaid (Markdown kompatibilní)
