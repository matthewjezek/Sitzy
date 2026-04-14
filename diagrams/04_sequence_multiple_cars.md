# Sekvenční Diagram - Více aut a přenos řidiče

```mermaid
sequenceDiagram
    actor Alice as 👨‍💼 Majitel<br/>(Alice)
    participant Frontend as 🖥️ Frontend
    participant Backend as 🔌 Backend
    participant Database as 💾 Database
    actor Bob as 👤 Bob
    actor Charlie as 👤 Charlie

    Alice->>Frontend: Vytvoří auto #1
    Frontend->>Backend: POST /cars<br/>{name: "Tesla", layout: "sedan"}
    Backend->>Database: INSERT cars<br/>(owner_id=Alice, name="Tesla")
    Database->>Backend: ✅ Created car #1
    Note over Backend,Database: CarDriver se NEVYTVÁŘÍ<br/>zatím není potřeba

    Alice->>Frontend: Vytvoří jízdu
    Frontend->>Backend: POST /rides<br/>{car_id=1, departure_time="2026-02-20",<br/>destination="Prague"}
    Backend->>Database: SELECT car_drivers<br/>WHERE car_id=1 AND driver_id=Alice
    Database->>Backend: Not found
    Backend->>Database: INSERT car_drivers<br/>(car_id=1, driver_id=Alice,<br/>is_active=true)
    Note over Backend,Database: Alice se stává řidičem<br/>při vytvoření první jízdy
    Backend->>Database: INSERT rides<br/>(car_id=1, car_driver_id=...,<br/>destination="Prague")
    Database->>Backend: ✅ Ride #42 created<br/>(Alice je řidič)

    Alice->>Frontend: Pošle pozvánky
    Frontend->>Backend: POST /rides/42/invite<br/>{emails: ["bob@ex.com", "charlie@ex.com"]}
    Backend->>Database: INSERT invitations<br/>(ride_id=42, invited_email="bob@ex.com")
    <br/>(ride_id=42, invited_email="charlie@ex.com")
    Database->>Backend: ✅ Invitations sent

    Bob->>Frontend: Přijme pozvánku
    Frontend->>Backend: POST /invitations/{token}/accept<br/>{seat_position: 2}
    Backend->>Database: UPDATE invitations SET status='accepted'
    Backend->>Database: INSERT passengers<br/>(user_id=Bob, ride_id=42, seat_position=2)
    Database->>Backend: ✅ Bob je pasažér na jízdě

    Alice->>Frontend: Převede řízení na Boba
    Frontend->>Backend: POST /rides/42/transfer-driver<br/>{new_driver_id: Bob}
    Backend->>Database: SELECT passengers<br/>WHERE ride.car_id=1 AND user.id=Bob
    Database->>Backend: ✅ Bob je pasažér na jízdě
    Backend->>Database: UPDATE/INSERT car_drivers<br/>(nový aktivní řidič Bob)
    Database->>Backend: ✅ Bob je nový aktivní řidič

    Note over Alice,Database: ✅ Flow v praxi:
    <br/>1. Alice vytvoří auto
    <br/>2. Vytvoří jízdu (stává se řidičem)
    <br/>3. Pozve Boba a Charlieho
    <br/>4. Bob přijme → stane se pasažérem
    <br/>5. Alice převede řízení na Boba<br/>(Bob musí být pasažér)
```

## Scénář:

1. **Alice** vytvoří auto → zatím žádný CarDriver záznam
2. **Alice** vytvoří jízdu → při tom se vytvoří CarDriver (první řidič)
3. **Alice** pošle pozvánky **Bobovi** a **Charliemu** na konkrétní jízdu
4. **Bob** přijme pozvánku → stává se pasažérem na jízdě
5. **Alice** převede řízení na **Boba** → Bob se stává aktivním řidičem
(kontroluje se, že je pasažér)
6. Historie v `car_drivers`: více záznamů pro stejná auta a řidiče,
Bobův záznam je aktivní

## Výhody:

- ✅ CarDriver vzniká až při vytvoření jízdy (když je skutečně potřeba)
- ✅ Řízení lze převést pouze na pasažéra (jednoduchá kontrola)
- ✅ Historie přenosů řízení (`car_drivers`)
- ✅ Aktivní řidič se ukládá přes `car_drivers`
- ✅ Flexibilní delegování odpovědnosti
