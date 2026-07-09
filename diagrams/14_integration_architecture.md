# Diagram integrační architektury a technologických hranic

Tento diagram znázorňuje celkovou architekturu systému Sitzy, technologické hranice jednotlivých komponent a toky dat mezi klientskou částí (prohlížeče řidiče a pasažéra), hraničním gatewayem (Cloudflare Worker), aplikačním backendem (FastAPI) a externími integračními službami, s explicitním vyznačením toku generování a sdílení pozvánky.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif", "clusterBkg": "none", "clusterBorder": "#000000", "nodeBkg": "#ffffff", "nodeBorder": "#000000"}}}%%
flowchart TD
    %% Definice vrstev a komponent
    subgraph ClientLayer["Klientská vrstva (Aplikace v prohlížeči)"]
        Browser_Driver["Prohlížeč řidiče<br/>(React SPA)"]
        Browser_Pass["Prohlížeč pasažéra<br/>(React SPA)"]
    end

    subgraph EdgeLayer["Hraniční vrstva (Cloudflare Edge)"]
        CF_Worker["Cloudflare Worker Gateway<br/>(sitzy-access)"]
        CF_KV[("Cloudflare Workers KV<br/>(SITZY_TOKENS)")]
    end

    subgraph FrontendLayer["Prezentační vrstva (Hosting)"]
        Vercel["Vercel Platform<br/>(Statické HTML/JS/CSS)"]
    end

    subgraph BackendLayer["Aplikační a datová vrstva"]
        FastAPI["FastAPI Backend<br/>(api.sitzy.page)"]
        Redis[("Redis Cache<br/>(PKCE stavy, Rate limiting)")]
        Postgres[("PostgreSQL DB<br/>(Uživatelé, auta, jízdy)")]
    end

    subgraph ExternalServices["Externí integrační vrstva"]
        FB_Auth["Facebook OAuth 2.0 API"]
        X_Auth["X / Twitter OAuth 2.0 API"]
    end

    %% --- Síťové toky a požadavky ---
    
    %% Hostování kódu
    Vercel -.->|"Stahování kódu SPA"| Browser_Driver
    Vercel -.->|"Stahování kódu SPA"| Browser_Pass

    %% Tok 1: Řidič vytvoří jízdu a generuje pozvánku
    Browser_Driver -->|"1. Vytvoření pozvánky<br/>(POST /rides/{id}/invite)"| CF_Worker
    
    %% Tok 2: Sdílení odkazu mimo systém (Out-of-band)
    Browser_Driver -.->|"2. Manuální sdílení odkazu /i/:token<br/>(Out-of-band: WhatsApp, Messenger, SMS)"| Browser_Pass

    %% Tok 3: Pasažér otevře odkaz a potvrdí místo
    Browser_Pass -->|"3. Rozlišení a přijetí pozvánky<br/>(GET /resolve, POST /accept)"| CF_Worker

    %% Běžné HTTPS požadavky pro správu
    Browser_Driver -->|"Správa aut a jízd (HTTPS)"| CF_Worker
    Browser_Pass -->|"Zobrazení dashboardu (HTTPS)"| CF_Worker
    
    %% Směrování v Gatewayi
    CF_Worker -->|"1. Statické soubory"| Vercel
    CF_Worker -->|"2. Průběh a sezení"| CF_KV
    CF_Worker -->|"3. API požadavky"| FastAPI
    
    %% Backend logiky a databáze
    FastAPI -->|"Čtení / Zápis stavu"| Redis
    FastAPI -->|"Perzistentní data SQL"| Postgres
    
    %% Integrace OAuth
    FastAPI -->|"Výměna tokenů & profil"| FB_Auth
    FastAPI -->|"Výměna tokenů & profil"| X_Auth
    
    Browser_Driver -.->|"Přesměrování na přihlášení"| FB_Auth
    Browser_Driver -.->|"Přesměrování na přihlášení"| X_Auth
    Browser_Pass -.->|"Přesměrování na přihlášení"| FB_Auth
    Browser_Pass -.->|"Přesměrování na přihlášení"| X_Auth

    %% Stylování ohraničení bez pozadí
    style ClientLayer fill:none,stroke:#000000,stroke-width:1px
    style EdgeLayer fill:none,stroke:#000000,stroke-width:1px
    style FrontendLayer fill:none,stroke:#000000,stroke-width:1px
    style BackendLayer fill:none,stroke:#000000,stroke-width:1px
    style ExternalServices fill:none,stroke:#000000,stroke-width:1px
```
