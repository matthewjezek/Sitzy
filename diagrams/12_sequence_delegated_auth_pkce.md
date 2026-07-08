# Sekvenční diagram – Delegovaná bezheslová autentizace s ochranou CSRF a PKCE

Tento diagram popisuje detailní průběh přihlášení uživatele prostřednictvím OAuth 2.0 s využitím PKCE (Proof Key for Code Exchange) a jednorázového stavového tokenu (state) jako ochrany proti CSRF (Cross-Site Request Forgery) a replay útokům.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif", "actorBkg": "#ffffff", "actorBorder": "#000000", "noteBkgColor": "#ffffff", "noteBorderColor": "#000000"}}}%%
sequenceDiagram
    autonumber
    actor Uzivatel as Uživatel
    participant Klient as Klient<br/>(React SPA)
    participant API as Sitzy API<br/>(FastAPI)
    participant Redis as Redis Cache
    participant Provider as Poskytovatel identity<br/>(OAuth Provider)
    participant DB as Databáze<br/>(PostgreSQL)

    Note over Uzivatel, DB: Fáze 1: Inicializace přihlášení a příprava PKCE + CSRF ochrany
    Uzivatel->>Klient: Kliknutí na tlačítko přihlášení
    activate Klient
    Klient->>API: POST /auth/oauth/{provider}/init
    activate API
    
    API->>API: Generování CSRF tokenu (state)<br/>a PKCE code_verifier
    API->>API: Výpočet PKCE code_challenge<br/>(SHA256 hash z code_verifier)
    
    API->>Redis: Uložení {state: (provider, code_verifier)}<br/>s TTL 10 minut
    activate Redis
    Redis-->>API: Potvrzení uložení
    deactivate Redis
    
    API-->>Klient: Vrácení authorization_url<br/>(obsahuje state a code_challenge)
    deactivate API
    
    Klient->>Provider: Přesměrování prohlížeče na authorization_url
    deactivate Klient
    activate Provider
    Provider->>Uzivatel: Zobrazení přihlašovací a schvalovací stránky
    
    Note over Uzivatel, DB: Fáze 2: Autentizace a udělení oprávnění uživatelem
    Uzivatel->>Provider: Přihlášení a schválení přístupu pro Sitzy
    Provider-->>Klient: Přesměrování zpět na /auth/callback?code=...&state=...
    deactivate Provider
    
    Note over Uzivatel, DB: Fáze 3: Ověření CSRF a PKCE, výměna kódu za tokeny
    activate Klient
    Klient->>API: GET /auth/oauth/callback?code=...&state=...
    activate API
    
    API->>Redis: Ověření a jednorázové smazání state (GETDEL)
    activate Redis
    Redis-->>API: Vrácení (provider, code_verifier)
    deactivate Redis
    
    alt State token v Redis neexistuje (CSRF útok / expirace)
        API-->>Klient: 400 Bad Request (Invalid state)
    else State token je validní
        API->>Provider: POST /oauth2/token<br/>(Zaslání code + code_verifier)
        activate Provider
        Provider->>Provider: Ověření code a hashování code_verifier<br/>pro porovnání s code_challenge
        Provider-->>API: Vrácení access_token + profilových dat
        deactivate Provider
        
        API->>DB: Vyhledání nebo registrace uživatele (find_or_create)
        activate DB
        DB-->>API: Instance uživatele
        deactivate DB
        
        API->>DB: Zápis nového sezení (create_or_update_session)
        activate DB
        DB-->>API: Uložení session
        deactivate DB
        
        API->>API: Generování JWT access_token a refresh_token
        API-->>Klient: 200 OK s JWT access_token a HttpOnly refresh_token cookie
        deactivate API
        Klient->>Uzivatel: Zobrazení dashboardu (Přihlášení úspěšné)
    end
    deactivate Klient
```
