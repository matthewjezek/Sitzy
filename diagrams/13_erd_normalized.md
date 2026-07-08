# Normalizované entitně-relační schéma databáze (ERD) – Sitzy

Tento diagram znázorňuje kompletní normalizované relační schéma PostgreSQL databáze aplikace Sitzy včetně typů entit, primárních a cizích klíčů a kardinalit vazeb.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif"}}}%%
erDiagram
    USERS {
        UUID id PK
        string email "nullable, indexed"
        string full_name
        string avatar_url "nullable"
        datetime created_at
        datetime updated_at
    }

    SOCIAL_ACCOUNTS {
        UUID id PK
        UUID user_id FK
        string provider "facebook | x"
        string social_id "UK, social UID"
        string email "nullable"
        datetime linked_at
    }

    SOCIAL_SESSIONS {
        UUID id PK
        UUID user_id FK
        UUID social_account_id FK
        string access_token
        string refresh_token "nullable"
        datetime expires_at
        datetime created_at
        datetime revoked_at "nullable"
        string user_agent "nullable"
    }

    CARS {
        UUID id PK
        UUID owner_id FK
        string name
        string layout "Sedan | SUV | Minivan"
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
        datetime revoked_at "nullable"
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
        UUID ride_id FK
        string invited_email
        string token UK
        string status "Pending | Accepted | Rejected | Expired"
        datetime created_at
        datetime expires_at
    }

    INTEGRATION_AUDIT_LOGS {
        UUID id PK
        UUID user_id FK "nullable"
        string event
        string provider "nullable"
        json metadata_json
        datetime created_at
    }

    %% Relační vazby a kardinality
    USERS ||--o{ SOCIAL_ACCOUNTS : "vlastní identity"
    USERS ||--o{ SOCIAL_SESSIONS : "má aktivní sezení"
    USERS ||--o{ CARS : "vlastní auta"
    USERS ||--o{ CAR_DRIVERS : "působí jako řidič"
    USERS ||--o{ PASSENGERS : "účastní se jako spolucestující"
    USERS ||--o{ INTEGRATION_AUDIT_LOGS : "generuje logy"

    SOCIAL_ACCOUNTS ||--o{ SOCIAL_SESSIONS : "autentizuje sezení"

    CARS ||--|{ SEATS : "obsahuje sedadla"
    CARS ||--o{ CAR_DRIVERS : "má přiřazené řidiče"
    CARS ||--o{ RIDES : "je použito pro jízdy"

    CAR_DRIVERS ||--o{ RIDES : "řídí konkrétní jízdu"

    RIDES ||--o{ PASSENGERS : "přepravuje spolucestující"
    RIDES ||--o{ INVITATIONS : "vytváří pozvánky"
```
