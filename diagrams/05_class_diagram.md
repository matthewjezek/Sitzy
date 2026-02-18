# Class Diagram - Python SQLAlchemy Modely

```mermaid
classDiagram
    class User {
        -UUID id
        -string email
        -string full_name
        -string avatar_url
        -datetime created_at
        -datetime updated_at
        +register()
        +login()
        +get_cars()
        +get_driven_cars()
    }

    class SocialAccount {
        -UUID id
        -UUID user_id
        -string provider
        -string social_id
        -string email
        -datetime linked_at
        +link_account()
        +unlink_account()
    }

    class SocialSession {
        -UUID id
        -UUID social_account_id
        -string access_token
        -string refresh_token
        -datetime expires_at
        -string user_agent
        +is_expired()
        +revoke()
        +refresh_token()
    }

    class Car {
        -UUID id
        -UUID owner_id
        -string name
        -string layout
        -datetime created_at
        -datetime updated_at
        +add_driver(driver: User)
        +remove_driver(driver: User)
        +create_ride(driver: User)
        +get_active_driver()
    }

    class CarDriver {
        -UUID id
        -UUID car_id
        -UUID driver_id
        -boolean is_active
        -datetime assigned_at
        -datetime revoked_at
        +activate()
        +deactivate()
        +is_valid()
    }

    class Ride {
        -UUID id
        -UUID car_id
        -UUID car_driver_id
        -datetime departure_time
        -string destination
        -datetime created_at
        +add_passenger(user: User, seat: int)
        +remove_passenger(user: User)
        +is_past()
        +get_empty_seats()
    }

    class Passenger {
        -UUID id
        -UUID user_id
        -UUID ride_id
        -int seat_position
        +cancel()
    }

    class Seat {
        -UUID car_id
        -int position
        +is_occupied(ride: Ride)
    }

    class Invitation {
        -UUID id
        -UUID car_id
        -string invited_email
        -string token
        -string status
        -datetime created_at
        -datetime expires_at
        +accept()
        +decline()
        +is_expired()
    }

    User "1" -- "N" Car : owns
    User "1" -- "N" SocialAccount : has
    User "1" -- "N" CarDriver : drives
    User "1" -- "N" Passenger : books
    
    SocialAccount "1" -- "N" SocialSession : has
    
    Car "1" -- "N" CarDriver : has
    Car "1" -- "N" Ride : has
    Car "1" -- "N" Seat : contains
    Car "1" -- "N" Invitation : sends
    
    CarDriver "1" -- "N" Ride : records
    
    Ride "1" -- "N" Passenger : includes
```

## Klíčové třídy:

### 🔐 Autentizace

- **User** - základní profil uživatele
- **SocialAccount** - propojení s OAuth providerem
- **SocialSession** - dočasné tokeny

### 🚗 Doména aplikace

- **Car** - auta vlastněná uživateli
- **CarDriver** - historie přiřazení řidičů
- **Ride** - konkrétní jízdy
- **Seat** - definice sedadel v autě
- **Passenger** - účast uživatele na jízdě
- **Invitation** - pozvánky k jízdě

## Poznámky:

- Všechny modely používají **UUID** jako primární klíč
- **Seat** má composite PK `(car_id, position)`
- Stavy jsou odvozovány z času (nepotřebujeme `status` fieldy)
