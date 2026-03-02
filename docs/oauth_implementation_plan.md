# Plán: OAuth přihlášení s X a Facebook

Implementace plně funkčního OAuth 2.0 přihlášení pro X a Facebook s JWT a
refresh tokeny, pokročilou bezpečností (rate limiting, CSRF ochrana,
session revocation) a podporou development/production prostředí. Navazuje
na existující DB schéma (`social_accounts`, `social_sessions`) a JWT
infrastrukturu v `security.py`.

## Klíčová rozhodnutí

- Použití Authlib pro OAuth klienty (podpora PKCE pro X).
- Dvojí tokenový systém: JWT access token (15 min) + refresh token (7 dní)
    uložený v `social_sessions`.
- State tokeny v Redis pro CSRF ochranu.
- SlowAPI pro rate limiting na OAuth endpointy.
- Konfigurace dle prostředí pro localhost vs HTTPS.

## Kroky

1. Přidat dependencies

    - Do `requirements.txt`: `authlib==1.3.0`, `redis==5.0.1`,
        `slowapi==0.1.9`.
    - Do `docker-compose.yml`: Redis service (port 6379).

1. Vytvořit konfigurační modul `api/config.py`

    - Pydantic `Settings` třída s validací (BaseSettings).
    - OAuth credentials:
        - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`.
        - `FACEBOOK_REDIRECT_URI`.
        - `X_CLIENT_ID`, `X_CLIENT_SECRET`.
        - `X_REDIRECT_URI`.
    - Redis: `REDIS_URL` (default: `redis://localhost:6379/0`).
    - Security: `ENVIRONMENT` (dev/prod), `SECRET_KEY`,
        `REFRESH_SECRET_KEY` (nový).
    - Token expirations: `ACCESS_TOKEN_EXPIRE_MINUTES=15`,
        `REFRESH_TOKEN_EXPIRE_DAYS=7`.
    - CORS: `FRONTEND_ORIGIN`.
    - Validace: HTTPS enforce v production mode.

1. Rozšířit JWT utilities v `security.py`

    - Nová funkce `create_refresh_token(user_id: UUID, session_id: UUID) -> str`.
        - Používá `REFRESH_SECRET_KEY` (odděleně od access tokenu).
        - Payload: `{"sub": str(user_id), "session_id": str(session_id),
            "type": "refresh"}`.
        - Expirace: 7 dní.
    - Nová funkce `decode_refresh_token(token: str) -> dict`.
        - Validuje `type == "refresh"`.
        - Vrací `user_id` a `session_id`.
    - Upravit `create_access_token()` - přidat `session_id` do payload
        (pro revocation check).

1. Vytvořit OAuth service `api/services/oauth_service.py`

    - `OAuthStateManager` třída:
        - `generate_state() -> str` - vytvoří CSRF token (32 bytes hex).
        - `store_state(state: str, provider: str, ttl=600)` - uloží do Redis
            s expirací.
        - `validate_and_consume_state(state: str) -> Optional[str]` - ověří a
            smaže (one-time use).
    - `FacebookOAuthClient` třída:
        - `get_authorization_url(state: str) -> str` - Facebook OAuth URL.
        - `exchange_code(code: str) -> dict` - získá access_token.
        - `get_user_info(access_token: str) -> dict` - email, name, id, avatar.
    - `XOAuthClient` třída (PKCE required):
        - `generate_pkce() -> tuple[str, str]` - code_verifier, code_challenge.
        - `get_authorization_url(state: str, code_challenge: str) -> str`.
        - `exchange_code(code: str, code_verifier: str) -> dict`.
        - `get_user_info(access_token: str) -> dict`.
    - `find_or_create_user(provider: str, social_id: str, email: str,
        full_name: str, avatar_url: str, db: Session) -> User`.
        - Hledá v `social_accounts` podle `provider` + `social_id`.
        - Pokud neexistuje: vytvoří `User` + `SocialAccount`.
        - Vrací `User` model.
    - `create_or_update_session(user_id: UUID, social_account_id: UUID,
        provider_access_token: str, provider_refresh_token: Optional[str],
        expires_in: int, user_agent: str, db: Session) -> SocialSession`.
        - Vytvoří nový záznam v `social_sessions`.
        - Uloží OAuth token od providera.
        - Vrací `SocialSession` s `id` pro JWT.

1. Implementovat OAuth endpointy v `auth.py`

    - Inicializace OAuth flow:
        - `POST /auth/oauth/facebook/init` (nahradit stub na řádku 28):
            - Rate limit: 10/minute (SlowAPI decorator).
            - Generuje `state` token a uloží do Redis.
            - Pro X: generuje PKCE `code_verifier`, ukládá do Redis, vrací
                `code_challenge`.
            - Vrací: `{"authorization_url": "...", "state": "..."}`.
        - `POST /auth/oauth/x/init` (nahradit stub na řádku 43):
            - Stejná logika, ale s PKCE.
            - Vrací: `{"authorization_url": "...", "state": "...",
                "code_verifier": "..."}` (frontend musí uložit code_verifier).
    - OAuth callback:
        - `GET /auth/oauth/callback` (nahradit stub na řádku 57):
            - Rate limit: 5/minute
            - Query params: `code`, `state`, `provider` (facebook/x).
            - Validace:
                - Zkontroluje `state` v Redis (CSRF ochrana).
                - Pro X: načte `code_verifier` z Redis.
                - Exchange `code` za `access_token` u providera.
                - Získá user info od providera.
                - Zavolá `find_or_create_user()` - auto-registrace.
                - Vytvoří `SocialSession`.
                - Generuje JWT access token (15 min) + refresh token (7 dní).
            - Vrací: `{"access_token": "...", "refresh_token": "...",
                "token_type": "bearer"}`.
    - Token refresh:
        - Nový endpoint `POST /auth/refresh`:
            - Rate limit: 30/minute.
            - Body: `{"refresh_token": "..."}`.
            - Validace:
                - Dekóduje refresh token, získá `session_id`.
                - Ověří, že `SocialSession` existuje a není revoked.
                - Zkontroluje `expires_at` v `social_sessions`.
            - Vrací: nový access token (stejný refresh token zůstává).
    - Session revocation:
        - Nový endpoint `POST /auth/revoke` (requires auth):
            - Dependency: `current_user: User = Depends(get_current_user)`.
            - Optional body: `{"session_id": "..."}` (pokud chybí, revoke
                všechny sessions uživatele).
            - Smaže záznamy z `social_sessions`.
            - Vrací: `{"revoked_sessions": 1}`.
    - Current user info:
        - Nový endpoint `GET /auth/me`:
            - Dependency: `current_user: User = Depends(get_current_user)`.
            - Vrací: `UserSchema` s `social_accounts` (bez tokenů).

1. Přidat rate limiting middleware v `main.py`

    - Import SlowAPI: `from slowapi import Limiter,
        _rate_limit_exceeded_handler`.
    - `limiter = Limiter(key_func=get_remote_address)`.
    - `app.state.limiter = limiter`.
    - `app.add_exception_handler(RateLimitExceeded,
        _rate_limit_exceeded_handler)`.
    - Dekorovat OAuth endpointy v `auth.py`.

1. Rozšířit schemas v `schemas.py`

    - `OAuthInitResponse`: `authorization_url`, `state`, `code_verifier`
        (optional).
    - `OAuthCallbackRequest`: `code`, `state`, `provider`.
    - `TokenResponse`: `access_token`, `refresh_token`, `token_type`,
        `expires_in`.
    - `RefreshTokenRequest`: `refresh_token`.
    - `RevokeSessionRequest`: `session_id` (optional).
    - `UserWithSocialAccountsSchema`: extends `UserSchema`, adds
        `social_accounts: List[SocialAccountSchema]`.
    - `SocialAccountSchema`: `provider`, `email`, `linked_at` (bez tokenů).

1. Upravit dependency v `deps.py`

    - `get_current_user()` rozšířit:
        - Po dekódování JWT zkontrolovat `session_id` v payload.
        - Ověřit, že `SocialSession` existuje a není expirovaná (JOIN query).
        - Pokud session neexistuje -> 401 Unauthorized (token byl revoked).

1. Aktualizovat frontend OAuth flow

    - LoginPage:
        - Přidat tlačítka "Login with Facebook" a "Login with X".
        - Handler `handleFacebookLogin()`:
            - Zavolá `POST /auth/oauth/facebook/init`.
            - Přesměruje na `authorization_url`.
        - Handler `handleXLogin()`:
            - Zavolá `POST /auth/oauth/x/init`.
            - Uloží `code_verifier` do `sessionStorage`.
            - Přesměruje na `authorization_url`.
    - Nová komponenta `frontend/src/pages/OAuthCallbackPage.tsx`:
        - Route: `/auth/callback`.
        - Parsuje `code`, `state`, `provider` z URL query.
        - Pro X: načte `code_verifier` ze `sessionStorage`.
        - Zavolá `GET /auth/oauth/callback?code=...&state=...&provider=...`.
        - Uloží `access_token` a `refresh_token` do `localStorage`.
        - Přesměruje na `/dashboard`.
    - `axios.ts`:
        - Response interceptor pro 401 chyby:
            - Pokud access token expiroval, zavolá `POST /auth/refresh` s refresh
                tokenem.
            - Aktualizuje `localStorage` s novým access tokenem.
            - Opakuje původní request.
            - Pokud refresh token selže -> redirect na login.

1. Environment setup a dokumentace

    - Vytvořit `.env.example` update s novými proměnnými:
        - OAuth Facebook.
        - OAuth X (Twitter).
        - JWT secrets.
        - Redis.
        - Environment.
    - Aktualizovat `README.md`:
        - Návod na registraci Facebook App.
        - Návod na registraci X App.
        - Konfigurace OAuth redirect URIs.
        - Lokální spuštění s Redisem (`docker-compose up redis`).

1. Security hardening

    - V `api/config.py`: `@validator('ENVIRONMENT')` - pokud `production`,
        vyžaduj HTTPS v redirect URIs.
    - V `api/services/oauth_service.py`:
        - Timeout na OAuth HTTP requests (5s).
        - SSL verify v production.
        - User-Agent header tracking (ukládat do `social_sessions.user_agent`).
    - V `main.py`:
        - `Secure` a `HttpOnly` cookies (pokud refresh token jako cookie místo
            JSON).
        - `SameSite=Lax` pro CSRF ochranu.

## Ověření

1. Unit testy

    - Vytvořit `api/routers/tests/test_oauth.py`.
    - Mock Authlib OAuth clients.
    - Test `/oauth/facebook/init` - vrací authorization URL.
    - Test `/oauth/callback` - vytváří User + SocialAccount + SocialSession.
    - Test `/auth/refresh` - generuje nový access token.
    - Test `/auth/revoke` - smaže session.
    - Test rate limiting (exceeded requests -> 429).

1. Manuální testování

    - `docker-compose up` - spustit Redis.
    - Vytvořit Facebook Test App + X Test App.
    - Přihlásit se přes Facebook -> verifikovat JWT v jwt.io.
    - Přihlásit se přes X -> verifikovat PKCE flow.
    - Počkat 16 minut -> access token expiruje -> otestovat refresh.
    - Zavolat `/auth/revoke` -> verifikovat 401 na dalších requestech.

1. Security audit checklist

    - [ ] State tokeny jsou one-time use (Redis smazání).
    - [ ] PKCE code_verifier není nikdy odeslán klientovi (zůstává v Redis
        pro X).
    - [ ] Refresh tokeny používají jiný SECRET_KEY.
    - [ ] Production mode enforce HTTPS redirect URIs.
    - [ ] Rate limiting aktivní na všech OAuth endpointech.
    - [ ] OAuth access tokeny od providerů nejsou v JWT (zůstávají v DB).
    - [ ] Session revocation funkční (JWT se stává neplatným).

1. Produkční checklist

    - [ ] `.env` s reálnými credentials (ne v gitu).
    - [ ] Redis persistence zapnutá (`redis.conf`).
    - [ ] HTTPS certifikát (Let's Encrypt).
    - [ ] CORS omezen na svou doménu.
    - [ ] Alembic migrace provedeny.
    - [ ] Monitoring session tabulky (čištění expirovaných záznamů).

## Rozhodnutí

- Authlib vs custom OAuth client: Authlib zvolena pro built-in PKCE support
    (X requirement) a standardizované API.
- Redis vs DB pro state tokeny: Redis preferovaný pro TTL auto-cleanup a
    rychlost (600s expiration).
- Dvojí secret keys (access vs refresh): Oddělené klíče zvyšují bezpečnost,
    kompromitace access tokenu neohrozí refresh tokeny.
- Session tracking v DB: Umožňuje revocation a audit trail (vs stateless
    JWT-only approach).
- Rate limiting na backend: SlowAPI místo NGINX - centralizovaná logika,
    snazší testování.
- PKCE pro X: Povinné podle X OAuth 2.0 dokumentace (od 2023).
- No password support: Architektonální rozhodnutí z 9c95e4bcb1a9 migrace -
    `users` tabulka nemá `hashed_password` sloupec.

## Poznámka

DRAFT připraven k review. Implementace pokrývá celý OAuth flow, refresh
tokeny, session revocation, rate limiting a HTTPS/localhost support.
Potřebujete něco upravit nebo můžeme přejít k implementaci?
