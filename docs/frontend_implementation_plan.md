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
- **Dashboard = Rides s filtrem**: `/dashboard` nahrazeno `/rides` –
    zobrazuje pouze nadcházející jízdy. Žádná samostatná dashboard stránka.
- **Stránky ke smazání**: `/dashboard`, `/create-car` (nahrazeno
    `/cars/new`), `/demo-seats`, `/test-seats`, `/position-test` (dev only,
    schovat za `ENVIRONMENT` check).
- **Pozvánky bez samostatné stránky**: oznámení přes zvoneček v navbar
    (dropdown s Accept/Reject přímo v UI). Po přijetí → automaticky přiřazeno
    první volné sedadlo (backend logika), uživatel si může sedadlo přenastavit
    na `/rides/:id`.
- **Transfer řidiče**: tlačítko "Předat řízení" vidí pouze majitel auta
    (ne aktuální řidič pokud není majitel).
- **`SeatRenderer` použití**: zobrazení zasedacího pořádku a obsazenosti
    na `/rides/:id`. Pasažér si vybírá nebo mění sedadlo přes `SeatRenderer`.
- **`seat_position` volitelné při accept**: backend vybere první volné
    sedadlo pokud `seat_position` není zadán (`Optional[int]` v
    `PassengerSeatIn`).
- **Optimistic UI + rollback**: změny se zobrazí okamžitě, zvrátí se pouze
    při chybě backendu. Platí pro: booking sedadla, přijetí/odmítnutí
    pozvánky, transfer řidiče, zrušení jízdy.
- **Skeleton loading**: místo spinneru se zobrazí tvarové kostry
    (`skeleton`) při načítání dat. Platí pro: seznam jízd, detail jízdy,
    seznam aut, detail auta, seznam pasažérů.
- **Stálá odezva UI**: každá akce uživatele musí mít okamžitou vizuální
    odezvu – tlačítko se deaktivuje + zobrazí loading stav po dobu requestu.
    Toast informuje o výsledku (úspěch/chyba).

## Responsible UI vzory

Tři vzory platí konzistentně napříč celou aplikací:

### 1. Skeleton loading

Při prvním načtení stránky nebo dat se místo spinneru zobrazí tvarová
kostra komponenty (`animate-pulse` Tailwind třídy). Kostra odpovídá
přibližnému tvaru skutečného obsahu – karty jízd, řádky pasažérů,
`SeatRenderer` placeholder.

```text
Načítání jízd:
┌─────────────────────────────┐
│ ░░░░░░░░░░  ░░░░░░          │  ← animate-pulse šedé bloky
│ ░░░░░░░░░░░░░░░░            │
│ ░░░░░                       │
└─────────────────────────────┘
```

Skeleton komponenty: `RideCardSkeleton`, `CarCardSkeleton`,
`PassengerListSkeleton`, `SeatRendererSkeleton`.

### 2. Optimistic UI + rollback

Změna se projeví **okamžitě** v UI bez čekání na backend. Pokud backend
vrátí chybu, změna se **automaticky zvrátí** a zobrazí se `toast.error`.

| Akce | Optimistic | Rollback při chybě |
| -- | -- | -- |
| Booking sedadla | Sedadlo se označí jako obsazené | Sedadlo se uvolní |
| Přijetí pozvánky | Pozvánka zmizí ze zvonečku | Pozvánka se vrátí |
| Odmítnutí pozvánky | Pozvánka zmizí ze zvonečku | Pozvánka se vrátí |
| Transfer řidiče | Nový řidič se zobrazí okamžitě | Původní řidič se vrátí |
| Zrušení jízdy | Jízda zmizí ze seznamu | Jízda se vrátí |
| Zrušení bookingu | Sedadlo se uvolní | Sedadlo se označí zpět |

### 3. Stálá odezva tlačítek

Každé tlačítko spouštějící async akci musí:

- Okamžitě se deaktivovat (`disabled`) po kliknutí.
- Zobrazit loading indikátor (spinner nebo `...` v textu).
- Po dokončení se reaktivovat.
- Zobrazit `toast.success` nebo `toast.error` podle výsledku.

```typescript
// Vzorový pattern pro všechna akční tlačítka:
const [submitting, setSubmitting] = useState(false)

const handleAction = async () => {
  setSubmitting(true)
  try {
    // optimistic update
    await apiCall()
    toast.success('Hotovo.')
  } catch {
    // rollback
    toast.error('Nepodařilo se.')
  } finally {
    setSubmitting(false)
  }
}

<button disabled={submitting} onClick={handleAction}>
  {submitting ? 'Ukládám...' : 'Uložit'}
</button>
```

## Backend změny vyplývající z frontend rozhodnutí

- `PassengerSeatIn.seat_position` → `Optional[int]` – pokud není zadán,
    backend vybere první volné sedadlo v daném autě automaticky.

## Struktura stránek

```text
/login                  → přihlášení (OAuth Facebook + X)
/auth/callback          → OAuth callback
/rides                  → seznam nadcházejících jízd (hlavní stránka)
/rides/new              → plánování nové jízdy
/rides/:id              → detail jízdy + SeatRenderer + pasažéři
/cars                   → seznam mých aut
/cars/new               → vytvoření auta
/cars/:id               → detail + úprava auta
/settings               → profil + dark mode + odhlášení
```

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
    - `carSchema` – `name` (2–50 znaků), `layout` (enum sedan/coupé/minivan).
    - `rideSchema` – `car_id` (required), `departure_time` (musí být
        v budoucnosti), `destination` (2–100 znaků, volitelné).
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

    `SeatPageNew.tsx` → přesunout logiku do `/rides/:id`:
    - `POST /seats/choose` → `POST /rides/{ride_id}/book`.
    - `DELETE /seats/` → `DELETE /rides/{ride_id}/book`.
    - `GET /cars/as-passenger` → nahradit za `GET /rides/`.

    `useCar.tsx`:
    - `GET /cars/my` → `GET /cars/`.
    - Odstranit `fetchPassengerCar` – přesunuto do `useRide`.

1. Nový hook `useRide.tsx`

    Nový soubor `frontend/src/hooks/useRide.tsx`:
    - `fetchMyRides()` – `GET /rides/` (filtrovat nadcházející na FE).
    - `fetchRide(id)` – `GET /rides/{id}`.
    - `createRide(data)` – `POST /rides/` (car_id, departure_time,
        destination).
    - `updateRide(id, data)` – `PATCH /rides/{id}`.
    - `cancelRide(id)` – `DELETE /rides/{id}`.
    - `bookSeat(rideId, seatPosition)` – `POST /rides/{rideId}/book`.
    - `cancelBooking(rideId)` – `DELETE /rides/{rideId}/book`.
    - `transferDriver(rideId, newDriverId)` – `POST /rides/{rideId}/transfer-driver`
        (pouze majitel auta).

1. Oprava hooků – axios instance

    `useInviteNotifications.tsx` a `useNotifications.tsx`:
    - Nahradit import `axios` za import custom `instance` z `../api/axios`.
    - Zajistí že refresh token interceptor funguje i zde.

    `CallAPI.tsx`:
    - Odstranit (superseded by axios interceptor).

1. Navigation opravy

    `Navigation.tsx`:
    - Mobile nav: nahradit `<a href="...">` za `<Link to="...">` z
        `react-router`.
    - Logout: opravit z `localStorage.removeItem('token')` →
        `localStorage.removeItem('access_token')` + volat `POST /auth/revoke`
        pro server-side cookie clear.
    - Přidat `title` atributy k ikonám pro accessibility (PWA requirement).
    - Přidat zvoneček s badge počtem čekajících pozvánek.
    - Dropdown pozvánek: Accept/Reject přímo v UI bez samostatné stránky.
    - Po přijetí pozvánky → přesměrování na `/rides/:id`.

1. SettingsPage – funkční

    `SettingsPage.tsx`:
    - Dark mode toggle přepínač (persist localStorage).
    - Zobrazit aktivní OAuth provider (Facebook/X ikonou).
    - Zobrazit datum registrace.
    - Tlačítko "Odhlásit se" → `POST /auth/revoke` + clear localStorage.
    - Odstranit nefunkční password field.
    - Validovat formulář přes Zod před `PATCH /auth/me` (pokud bude
        endpoint).

1. Rides stránky

    `/rides` (`RidesPage.tsx`) – nahrazuje Dashboard:
    - Seznam nadcházejících jízd z `GET /rides/` (filtr na FE:
        `departure_time > now()`).
    - Karta jízdy: auto, čas odjezdu, cíl, sedadlo uživatele, stav.
    - Prázdný stav s CTA "Vytvořit jízdu".
    - Tlačítko "+ Nová jízda" → `/rides/new`.

    `/rides/new` (`CreateRidePage.tsx`):
    - Formulář: výběr auta (dropdown `GET /cars/`), datum a čas odjezdu,
        cíl cesty (volitelné).
    - Validace přes Zod (`rideSchema`).
    - Po vytvoření → přesměrování na `/rides/:id`.

    `/rides/:id` (`RideDetailPage.tsx`):
    - `SeatRenderer` – vizuál zasedacího pořádku a obsazenosti.
    - Pasažér si vybírá sedadlo kliknutím na `SeatRenderer`.
    - Seznam pasažérů s avatary.
    - Tlačítko "Pozvat" → formulář s emailem (validace `inviteSchema`).
    - Tlačítko "Předat řízení" – pouze majitel auta → modal s výběrem
        pasažéra.
    - Tlačítko "Zrušit jízdu" – pouze majitel auta.

    `/cars` (`CarsPage.tsx`):
    - Seznam aut z `GET /cars/`.
    - Prázdný stav s CTA "Přidat auto".
    - Tlačítko "+ Přidat auto" → `/cars/new`.

    `/cars/new` (`CreateCarPage.tsx`):
    - Formulář: název, layout (sedan/coupé/minivan).
    - Validace přes Zod (`carSchema`).
    - Po vytvoření → přesměrování na `/cars/:id`.

    `/cars/:id` (`CarDetailPage.tsx`):
    - Detail auta + úprava (název, layout).
    - Seznam jízd tohoto auta.
    - Tlačítko "Smazat auto".

1. Selenium testovací sada

    Nový soubor `selenium/conftest.py` – pytest fixtures, headless Chrome,
    base URL.

    Nový soubor `selenium/test_auth_flow.py`:
    - `test_login_page_renders` – oba OAuth tlačítka viditelná.
    - `test_dark_mode_toggle` – přepnutí v Settings persistence.
    - `test_protected_route_redirect` – `/rides` bez tokenu → `/login`.
    - `test_seat_renderer_visibility` – `SeatRenderer` zobrazen na
        `/rides/:id`.
    - `test_logout_clears_token` – po odhlášení `access_token` odstraněn
        z localStorage.
    - `test_pwa_manifest_accessible` – `GET /manifest.webmanifest` vrací 200.
    - `test_notification_bell_visible` – zvoneček viditelný po přihlášení.
    - `test_invite_accept_redirects_to_ride` – přijetí pozvánky →
        přesměrování na `/rides/:id`.

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
