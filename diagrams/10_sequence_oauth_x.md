# Sekvenční diagram – Výměna autorizačního kódu za tokeny (X / Twitter)

Tento diagram znázorňuje proces výměny autorizačního kódu (Authorization Code) získaného z X (Twitter) za přístupové tokeny v systému Sitzy za použití mechanismu PKCE.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif", "actorBkg": "#ffffff", "actorBorder": "#000000", "noteBkgColor": "#ffffff", "noteBorderColor": "#000000"}}}%%
sequenceDiagram
    autonumber
    participant Klient as Klient<br/>(React)
    participant API as Sitzy API<br/>(FastAPI)
    participant XAPI as X API<br/>(Twitter)
    participant DB as Databáze<br/>(PostgreSQL/State)

    Note over Klient, DB: Výměna autorizačního kódu za tokeny (X / Twitter OAuth 2.0 PKCE)

    Klient->>API: GET /auth/oauth/callback?code=...&state=...
    activate API
    
    API->>DB: Validace a spotřebování state tokenu<br/>(Získání code_verifier pro PKCE)
    activate DB
    DB-->>API: Vrácení code_verifier a provideru ("x")
    deactivate DB

    API->>XAPI: POST /oauth2/token<br/>(Výměna code + code_verifier za X tokens)
    activate XAPI
    XAPI-->>API: Vrácení X tokens (access_token, refresh_token)
    deactivate XAPI

    API->>XAPI: GET /users/me<br/>(Získání profilových údajů přes X access_token)
    activate XAPI
    XAPI-->>API: Uživatelská data (social_id, display_name, avatar_url)
    deactivate XAPI

    API->>DB: Vyhledání nebo vytvoření uživatele a účtu<br/>(find_or_create_user)
    activate DB
    DB-->>API: Objekt uživatele (User ID)
    deactivate DB

    API->>DB: Uložení/Aktualizace sociální relace<br/>(create_or_update_session)
    activate DB
    DB-->>API: Potvrzení uložení relace (SocialSession ID)
    deactivate DB

    API->>API: Generování JWT access_token a refresh_token
    
    API-->>Klient: 200 OK s JWT access_token v těle<br/>+ HttpOnly cookie s refresh_token
    deactivate API
```
