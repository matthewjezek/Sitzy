# Sekvenční Diagram - Životní Cyklus Access/Refresh Session

```mermaid
sequenceDiagram
    actor User as 👤 Uživatel
    participant Frontend as 🖥️ Frontend<br/>(React)
    participant Backend as 🔌 Backend<br/>(FastAPI)
    participant Redis as 🧠 Redis
    participant Database as 💾 Database

    User->>Frontend: Přihlásí se přes OAuth
    Frontend->>Backend: /auth/oauth/*/init
    Backend->>Redis: Uloží state / PKCE data
    Backend->>Database: Vytvoří nebo najde User + SocialAccount
    Backend->>Database: Vytvoří SocialSession
    Backend->>Frontend: access_token + refresh_token cookie

    loop Každý request s access tokenem
        Frontend->>Backend: Authorization: Bearer access_token
        Backend->>Database: Ověří session_id v SocialSession
        Backend->>Frontend: 200 OK nebo 401
    end

    alt Access token vyprší
        Frontend->>Backend: POST /auth/refresh
        Backend->>Database: Ověří refresh cookie + SocialSession
        Backend->>Frontend: Nový access_token + rotated refresh cookie
    end

    alt Uživatel se odhlásí
        Frontend->>Backend: POST /auth/revoke
        Backend->>Database: Nastaví revoked_at na SocialSession
        Backend->>Frontend: Smaže refresh cookie
    end

    note over Frontend,Database: Access token je krátkodobý (15 minut),<br/>refresh token je v HttpOnly cookie (7 dní).
```

## Co diagram pokrývá

- Login session po OAuth callbacku
- Ověřování access tokenu na každém requestu
- Refresh flow přes HttpOnly cookie
- Revokaci session při logoutu
