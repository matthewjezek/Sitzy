# Plán: Frontend Redesign – PWA, Dark Mode, Validace, Selenium

Stávající frontend má solidní základy (React 18, Tailwind v4, SeatRenderer,
OAuth flow, hamburger menu), ale potřebuje: dark mode, PWA manifest, lokální
validaci formulářů přes Zod, opravu endpoint nesrovnalostí s novým backend
API, funkční SettingsPage, opravené hooky (sbírají přímý `axios` bez
instance), a Selenium testovací sadu. Zachováme `SeatRenderer` beze změny.
Unifikujeme barevné téma – navrhujeme přechod z `indigo` na teplý
`violet`/`purple` (lépe čitelný v dark mode, moderní PWA feeling).

## Klíčová rozhodnutí

- **Violet místo Indigo**: `violet-700` (#7c3aed) jako `primary`, lépe
    kontrastuje v dark i light mode; pouze 1 CSS proměnná změna v
    `index.css`.
- **Zod + react-hook-form**: průmyslový standard pro validaci,
    `@hookform/resolvers/zod` spojuje oboje.
- **vite-plugin-pwa**: automaticky generuje `manifest.webmanifest` + Workbox
    service worker z Vite konfigurace.
- **SeatRenderer beze změny**: zachován jako-je; pouze vizuálně obalí
    `dark:` wrapper ve stránce.
- **Selenium místo Playwright**: konzistentní s pythonovým backendem
    (pytest), jednodušší CI/CD integrace.

## Kroky

1. Přidat dependencies

    Přidat do `package.json`:
    - `zod` – lokální validační schémata.
    - `react-hook-form` + `@hookform/resolvers` – správa stavu formulářů.
    - `vite-plugin-pwa` – service worker + manifest generování.

1. PWA setup

    Přidat `vite-plugin-pwa` do `vite.config.mjs` s konfigurací:
    - `name: "Sitzy"`, `short_name: "Sitzy"`,
        `theme_color: "#7c3aed"` (violet-700).
    - `display: "standalone"`, `start_url: "/"`.
    - iOS meta tagy do `index.html`: `apple-mobile-web-app-capable`,
        `apple-touch-icon`.
    - Offline fallback na `/login`.
    - Ikony: generovat z `favicon.png` (192×192, 512×512).

1. Dark mode

    Tailwind v4 dark class strategy v `index.css`:
    - Přidat `dark:` varianty ke všem komponentám v `@layer components`.
    - Tmavé pozadí `dark:bg-gray-950`, karty `dark:bg-gray-900`, text
        `dark:text-gray-100`.
    - Přepínač dark mode v `SettingsPage.tsx` – persist v `localStorage`
        key `"theme"`.
    - Logika přepínání v `App.tsx` – přidá/odebere `dark` class na `<html>`
        elementu při startu.

1. Lokální validace – Zod schémata

    Nový soubor `frontend/src/utils/validation.ts`:
    - `carSchema` – `name` (2–50 znaků), `layout` (enum sedan/coupé/minivan),
        `departure_time` (musí být v budoucnosti).
    - `inviteSchema` – `email` (validní formát, lowercase normalizace).
    - `seatSchema` – `seat_position` (1–7 dle layoutu).

    Žádný request na backend pokud Zod selže – chyba se zobrazí inline
    u pole.

1. Oprava endpoint nesrovnalostí

    `useInvites.tsx` – aktuální hooky volají staré URL:
    - `GET /cars/{id}/invitations` → `GET /invitations/ride/{ride_id}`.
    - `POST /cars/{id}/invite` → `POST /rides/{ride_id}/invite`.
    - `DELETE /invitations/{token}` – beze změny.
    - `POST /invitations/{token}/accept` + `/reject` – beze změny.

    `SeatPageNew.tsx`:
    - `POST /seats/choose` → `POST /rides/{ride_id}/book`.
    - `DELETE /seats/` → `DELETE /rides/{ride_id}/book`.
    - `GET /cars/as-passenger` – ověřit nebo nahradit za `GET /rides/`.

    `useCar.tsx`:
    - `GET /cars/my` → `GET /cars/` (vrací list, vezmi první).
    - `fetchPassengerCar` endpoint ověřit.

1. Nový hook `useRide.tsx`

    Nový soubor `frontend/src/hooks/useRide.tsx`:
    - `fetchMyRides()` – `GET /rides/`.
    - `createRide(data)` – `POST /rides/`.
    - `updateRide(id, data)` – `PATCH /rides/{id}`.
    - `cancelRide(id)` – `DELETE /rides/{id}`.
    - `bookSeat(rideId, seatPosition)` – `POST /rides/{rideId}/book`.
    - `cancelBooking(rideId)` – `DELETE /rides/{rideId}/book`.
    - `transferDriver(rideId, newDriverId)` – `POST /rides/{rideId}/transfer-driver`.

1. Oprava hooků – axios instance

    `useInviteNotifications.tsx` a `useNotifications.tsx`:
    - Nahradit import `axios` za import custom `instance` z `../api/axios`.
    - Zajistí že refresh token interceptor funguje i zde.

    `CallAPI.tsx`:
    - Odstranit (superseded by axios interceptor) nebo refaktorovat jako
        pure helper (bez `useNavigate`).

1. Navigation opravy

    `Navigation.tsx`:
    - Mobile nav: nahradit `<a href="...">` za `<Link to="...">` z
        `react-router`.
    - Logout: opravit z `localStorage.removeItem('token')` →
        `localStorage.removeItem('access_token')` + volat `POST /auth/revoke`
        pro server-side cookie clear.
    - Přidat `title` atributy k ikonám pro accessibility (PWA requirement).

1. SettingsPage – funkční

    `SettingsPage.tsx`:
    - Dark mode toggle přepínač (persist localStorage).
    - Zobrazit aktivní OAuth provider (Facebook/X ikonou).
    - Zobrazit datum registrace.
    - Tlačítko "Odhlásit se ze všech zařízení" → `POST /auth/revoke`.
    - Odstranit nefunkční password field.
    - Validovat formulář přes Zod před `PATCH /auth/me`.

1. DashboardPage – updated

    `DashboardPage.tsx`:
    - Zobrazit seznam nadcházejících jízd místo jedné (z `GET /rides/`).
    - Karty jízd s `<RideStatus>` a sedadlem uživatele.
    - Prázdný stav s CTA "Vytvořit jízdu" nebo "Čekám na pozvání".

1. Selenium testovací sada

    Nový soubor `selenium/conftest.py` – pytest fixtures, headless Chrome,
    base URL.

    Nový soubor `selenium/test_auth_flow.py`:
    - `test_login_page_renders` – oba OAuth tlačítka viditelná.
    - `test_dark_mode_toggle` – přepnutí v Settings persistence.
    - `test_protected_route_redirect` – `/dashboard` bez tokenu → `/login`.
    - `test_seat_renderer_visibility` – `SeatRenderer` zobrazen na CarPage.
    - `test_logout_clears_token` – po odhlášení `access_token` odstraněn
        z localStorage.
    - `test_pwa_manifest_accessible` – `GET /manifest.webmanifest` vrací 200.

## Ověření

```bash
cd frontend && npm install
npm run build           # Vite build + PWA manifest generování
npm run dev             # Dev server

# Python Selenium testy
pip install selenium pytest pytest-selenium
pytest selenium/ -v
```

PWA validace: Chrome DevTools → Application → Manifest (žádné chyby),
Lighthouse → PWA audit.
