# ER Diagram - Budoucí Architektura (s OAuth)

```mermaid
erDiagram
    %% --- UŽIVATELÉ ---
    USERS {
        UUID id PK
        string email UK
        string full_name
        string avatar_url
        datetime created_at
        datetime updated_at
    }

    %% --- IDENTITA (Trvalé propojení) ---
    SOCIAL_ACCOUNTS {
        UUID id PK
        UUID user_id FK
        string provider "facebook | x"
        string social_id "Permanent UID"
        string email "Email from provider"
        datetime linked_at
    }

    %% --- RELACE / TOKENY (Dočasné klíče) ---
    SOCIAL_SESSIONS {
        UUID id PK
        UUID social_account_id FK
        string access_token
        string refresh_token
        datetime expires_at
        string user_agent "Chrome/Mobile..."
    }

    %% --- DOMÉNA APLIKACE ---
    CARS {
        UUID id PK
        UUID owner_id FK
        string name
        string layout
        datetime created_at
        datetime updated_at
    }

    SEATS {
        UUID car_id PK,FK
        int position PK
    }

    CAR_DRIVERS {
        UUID id PK
        UUID car_id FK
        UUID driver_id FK
        boolean is_active
        datetime assigned_at
        datetime revoked_at
    }

    RIDES {
        UUID id PK
        UUID car_id FK
        UUID car_driver_id FK
        datetime departure_time
        string destination
        datetime created_at
    }

    PASSENGERS {
        UUID id PK
        UUID user_id FK
        UUID ride_id FK
        int seat_position
    }

    INVITATIONS {
        UUID id PK
        UUID car_id FK
        string invited_email
        string token UK
        string status
        datetime created_at
        datetime expires_at
    }

    %% --- VAZBY ---
    USERS ||--o{ CARS : "vlastní"
    USERS ||--|{ SOCIAL_ACCOUNTS : "má propojené identity"
    USERS ||--o{ CAR_DRIVERS : "je řidičem"
    USERS ||--o{ PASSENGERS : "je pasažérem"
    
    SOCIAL_ACCOUNTS ||--|{ SOCIAL_SESSIONS : "má aktivní sezení"

    CARS ||--|{ SEATS : "obsahuje"
    CARS ||--o{ CAR_DRIVERS : "má řidiče"
    CARS ||--o{ RIDES : "realizuje"
    CARS ||--o{ INVITATIONS : "má pozvánky"

    CAR_DRIVERS ||--o{ RIDES : "historie řidiče"
    
    RIDES ||--o{ PASSENGERS : "veze"
```

## Klíčové vylepšení:

### 🔐 OAuth Autentizace

- **SOCIAL_ACCOUNTS** - trvalé propojení uživatele s OAuth providerem
- **SOCIAL_SESSIONS** - dočasné access tokeny (pro revokaci)
- `USERS.hashed_password` odstraněno (pouze OAuth)

### 🚗 Více aut na uživatele

- `USERS ||--o{ CARS` místo 1:1

### 👨‍✈️ Oddělení majitel vs. řidič

- **CAR_DRIVERS** - historie přiřazení řidičů
- Právě jeden aktivní řidič na auto (`is_active=true`)
- `RIDES.car_driver_id` odkazuje na konkrétní záznam historie

### 📊 Optimalizace

- **SEATS** má composite PK `(car_id, position)` místo UUID
- Žádné zbytečné `status` pole (odvozuje se z času)
- `PASSENGERS.booked_at` odstraněno (duplicitní k pozvánkám)
