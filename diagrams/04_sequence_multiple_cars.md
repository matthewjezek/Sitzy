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
    Backend->>Database: INSERT car_drivers<br/>(car_id=1, driver_id=Alice,<br/>is_active=true)
    Note over Backend,Database: Alice je automaticky<br/>první řidič

    Alice->>Frontend: Vytvoří jízdu
    Frontend->>Backend: POST /rides<br/>{car_id=1, departure_time="2026-02-20",<br/>destination="Prague"}
    Backend->>Database: SELECT car_drivers<br/>WHERE car_id=1 AND is_active=true
    Database->>Backend: driver_id=Alice
    Backend->>Database: INSERT rides<br/>(car_id=1, car_driver_id=...,<br/>destination="Prague")
    Database->>Backend: ✅ Ride #42 created<br/>(Alice je řidič)

    Alice->>Frontend: Pošle pozvánky
    Frontend->>Backend: POST /rides/42/invite<br/>{emails: ["bob@ex.com", "charlie@ex.com"]}
    Backend->>Database: INSERT invitations<br/>(car_id=1, invited_email="bob@ex.com")<br/>(car_id=1, invited_email="charlie@ex.com")
    Database->>Backend: ✅ Invitations sent

    Bob->>Frontend: Přijme pozvánku
    Frontend->>Backend: POST /invitations/{token}/accept
    Backend->>Database: UPDATE invitations SET status='accepted'
    Backend->>Database: INSERT passengers<br/>(user_id=Bob, ride_id=42, seat_position=2)
    Database->>Backend: ✅ Bob je pasažér na jízdě

    Alice->>Frontend: Převede řízení na Boba
    Frontend->>Backend: PUT /cars/1/transfer-driver<br/>{new_driver_id=Bob}
    Backend->>Database: UPDATE car_drivers<br/>SET is_active=false WHERE driver_id=Alice
    Backend->>Database: INSERT car_drivers<br/>(car_id=1, driver_id=Bob, is_active=true)
    Database->>Backend: ✅ Bob je nový aktivní řidič

    Note over Alice,Database: ✅ Flow v praxi:<br/>1. Alice vytvoří auto (je řidič)<br/>2. Vytvoří jízdu (ona řídí)<br/>3. Pozve Boba a Charlieho<br/>4. Bob přijme → stane se pasažérem<br/>5. Alice může převést řízení na Boba
```

## Scénář:

1. **Alice** vytvoří auto → stává se automaticky prvním řidičem
2. **Alice** vytvoří jízdu → ona je defaultně řidič
3. **Alice** pošle pozvánky **Bobovi** a **Charliemu**
4. **Bob** přijme pozvánku → stává se pasažérem na jízdě
5. **Alice** převede řízení na **Boba** → Bob se stává aktivním řidičem
6. Historie v `car_drivers`: Alice → Bob (tracked)

## Výhody:

- ✅ Majitel je automaticky první řidič
- ✅ Řízení lze převést pouze na uživatele, kteří přijali pozvánku
- ✅ Historie přenosů řízení (`car_drivers`)
- ✅ Jen jeden aktivní řidič na auto (`is_active=true`)
- ✅ Flexibilní delegování odpovědnosti
