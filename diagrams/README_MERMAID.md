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
| [02_er_current.md](02_er_current.md) | ER Diagram - Aktuální architektura (1:1 User:Car) |
| [02_er_future.md](02_er_future.md) | ER Diagram - Budoucí architektura (OAuth + 1:N User:Car) |
| [03_sequence_oauth.md](03_sequence_oauth.md) | Sequence Diagram - OAuth Login Flow |
| [04_sequence_multiple_cars.md](04_sequence_multiple_cars.md) | Sequence Diagram - Více aut a přenos řidiče |
| [05_class_diagram.md](05_class_diagram.md) | Class Diagram - Python SQLAlchemy Modely |

---

## 📋 Obsah Diagramů

### 1️⃣ Use Case Diagram

- **Role**: Řidič vs. Pasažér
- **Interakce**: Registrace, přihlášení, vytvoření auta, pozvánky
- **Tok**: Majitel → Řidič → Pasažér

### 2️⃣ ER Diagram - Současný stav

- 1:1 vztah User:Car
- Jednoduché tabulky bez oddělení řidiče
- Bez OAuth

### 3️⃣ ER Diagram - Budoucí architektura ⭐

- **OAuth tabulky**: `SOCIAL_ACCOUNTS`, `SOCIAL_SESSIONS`
- **1:N User:Car** (více aut na uživatele)
- **Historie řidičů**: `CAR_DRIVERS` tabulka
- **Optimalizace**: Composite PKs, žádné zbytečné fields

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

## ✅ Kontrolní seznam

- [x] Use Case diagram
- [x] ER diagram - současný stav
- [x] ER diagram - budoucí architektura
- [x] Sequence diagram - OAuth
- [x] Sequence diagram - Multiple cars
- [x] Class diagram
- [x] README s instrukcemi

---

**Poslední aktualizace**: 18. února 2026

**Formát**: Mermaid (Markdown kompatibilní)
