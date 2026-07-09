# UML Komponentní diagram (Component Diagram) – Sitzy

Tento diagram znázorňuje vnitřní logickou strukturu systému Sitzy. Zobrazuje jednotlivé softwarové komponenty v rámci klientské části (React), serverové části (FastAPI) a jejich vzájemné vazby, rozhraní a závislosti.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif", "clusterBkg": "none", "clusterBorder": "#000000", "nodeBkg": "#ffffff", "nodeBorder": "#000000"}}}%%
flowchart TD
    %% --- KLIENTSKÁ ČÁST (React SPA) ---
    subgraph Frontend["React Frontend (Klientská komponenta)"]
        FE_Router["Směrovač<br/>(React Router)"]
        FE_Pages["Stránky aplikace<br/>(Dashboard, RideDetail, InviteEntry)"]
        FE_UI["Uživatelské rozhraní<br/>(SeatRenderer, RideSummaryCard)"]
        FE_Hooks["Vlastní stavové háčky<br/>(useAuth, useRide, useInvites)"]
        FE_Context["Správa globálního stavu<br/>(AuthContext, PWAContext)"]
        FE_API["API Klient<br/>(Axios s interceptory pro JWT)"]
    end

    %% --- SERVEROVÁ ČÁST (FastAPI Backend) ---
    subgraph Backend["FastAPI Backend (Serverová komponenta)"]
        BE_Middleware["Bezpečnostní mezivrstvy<br/>(CORS, Slowapi rate limiter)"]
        BE_Routers["Směrovače API routery<br/>(/auth, /rides, /cars, /invitations)"]
        BE_Auth["Autentizační modul<br/>(Ověření JWT, PKCE state manager)"]
        BE_Services["Aplikační logika<br/>(OAuth výměna, obsazování sedadel)"]
        BE_ORM["ORM Modely<br/>(SQLAlchemy entity)"]
        BE_DB["Správce DB spojení<br/>(SQLAlchemy Engine/Session)"]
    end

    %% --- DATABÁZOVÁ VRSTVA ---
    subgraph Database["Datová vrstva"]
        Postgres[("PostgreSQL DB")]
        Redis[("Redis Cache")]
    end

    %% --- VNITŘNÍ VAZBY - FRONTEND ---
    FE_Pages --> FE_Router
    FE_Pages --> FE_UI
    FE_Pages --> FE_Hooks
    FE_Hooks --> FE_Context
    FE_Hooks --> FE_API

    %% --- VNITŘNÍ VAZBY - BACKEND ---
    BE_Routers --> BE_Middleware
    BE_Routers --> BE_Auth
    BE_Routers --> BE_Services
    BE_Services --> BE_ORM
    BE_ORM --> BE_DB

    %% --- MEZIKOMPONENTNÍ INTEGRACE ---
    FE_API == REST API / JSON <br/> (HTTPS + JWT Access Token) ==> BE_Middleware
    BE_Auth -.->|Ověření PKCE state| Redis
    BE_DB -.->|SQL dotazy přes psycopg2| Postgres

    %% Stylování ohraničení bez pozadí
    style Frontend fill:none,stroke:#000000,stroke-width:1px
    style Backend fill:none,stroke:#000000,stroke-width:1px
    style Database fill:none,stroke:#000000,stroke-width:1px
```
