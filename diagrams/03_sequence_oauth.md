# Sekvenční Diagram - OAuth Login Flow

```mermaid
sequenceDiagram
    actor User as 👤 Uživatel
    participant Frontend as 🖥️ Frontend<br/>(React)
    participant AuthProvider as 🔐 OAuth<br/>(Facebook/X)
    participant Backend as 🔌 Backend<br/>(FastAPI)
    participant Database as 💾 Database

    User->>Frontend: Klikne "Přihlásit se"
    Frontend->>AuthProvider: Přesměruje na OAuth login
    AuthProvider->>User: Zobrazí login formulář
    User->>AuthProvider: Zadá přihlášení
    AuthProvider->>Frontend: Vrátí authorization code
    Frontend->>Frontend: Uloží code
    Frontend->>Backend: POST /auth/oauth/callback<br/>(code)
    Backend->>AuthProvider: Ověří code<br/>Vyžádá access token
    AuthProvider->>Backend: Vrátí access_token<br/>+ user info (email, name, id)
    Backend->>Database: SELECT user WHERE email = ?
    
    alt User existuje
        Database->>Backend: Vrátí User data
        Backend->>Backend: Vygeneruje JWT token<br/>(7 dní expiraci)
    else User neexistuje
        Database->>Backend: User není nalezen
        Backend->>Database: INSERT User<br/>(email, created_at)
        Database->>Backend: Vrátí User ID
        Backend->>Backend: Vygeneruje JWT token
    end
    
    Backend->>Backend: Uloží OAuth token v session
    Backend->>Frontend: 200 OK<br/>{<br/>  "access_token": "JWT...",<br/>  "token_type": "bearer",<br/>  "user": {...}<br/>}
    Frontend->>Frontend: Uloží JWT do localStorage
    Frontend->>Frontend: Nastaví Auth header:<br/>Authorization: Bearer JWT...
    Frontend->>User: Přesměruje na /dashboard
    
    Note over User,Database: ✅ Uživatel je přihlášen<br/>Všechny další požadavky<br/>se odesílají s JWT tokenem
```

## Klíčové kroky:

1. **OAuth flow** - uživatel se přihlásí přes Facebook/X
2. **Code exchange** - frontend vymění authorization code za access token
3. **User lookup** - backend hledá uživatele podle emailu
4. **Auto-registration** - pokud user neexistuje, vytvoří se automaticky
5. **JWT generation** - backend vrátí vlastní JWT token (7 dní)
6. **Local storage** - frontend uloží JWT pro další požadavky

## Výhody tohoto přístupu:

- ✅ OAuth token zůstává na backendu (bezpečnější)
- ✅ Frontend používá JWT (bezstavová autentizace)
- ✅ Plná kontrola nad expirací (můžete nastavit 7 dní)
- ✅ Možnost refreshu tokenu
