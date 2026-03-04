# Sitzy - Copilot Instructions

## Project Overview
Sitzy is a bilingual car seat management web app: **Czech UI/comments** with English code. Users authenticate via OAuth (Facebook/X), create cars with different layouts (Sedan/Coupé/Minivan), and manage ride seat assignments through an interactive UI.

**Stack:** FastAPI + SQLAlchemy 2.0 + PostgreSQL (backend), React 19 + TypeScript + Tailwind v4 (frontend), Redis (OAuth state), Alembic (migrations).

## Data Model & Architecture

**Core Entities:**
- **Users** — OAuth-only accounts (no passwords). Each user can own multiple cars and participate in rides.
- **SocialAccount** — Permanent link: one per provider (Facebook/X), stores `provider` and `social_id`.
- **SocialSession** — Temporary tokens: dual FK to User and SocialAccount, tracks `expires_at` and `revoked_at` for session revocation.
- **Cars** — Layouts: `SEDAQ` (4 seats), `TRAPAQ` (2 seats), `PRAQ` (7 seats). Owner creates car → optionally creates rides (becomes initial driver).
- **CarDriver** — Bridge: tracks which user drives which car. Only ONE `is_active=true` per car. Created lazily (first time ride is created).
- **Rides** — Concrete events: car + departure_time + destination. References `car_driver_id` (which driver at that time).
- **Passengers** — Ride participants: user + seat_position (1–7). Created when invitation accepted.
- **Invitations** — Email-based: `ride_id` (not `car_id`), one-time token, expires in 24h. Status: PENDING → ACCEPTED/REJECTED.
- **Seats** — Composite PK `(car_id, position)`. Serves as seat catalog (no bookings stored here).

**Key Pattern:** CarDriver created **on-demand** when first ride created (not when car created). Transfer driver → update `is_active=false` on old CarDriver, insert new one with `is_active=true`.

## Architecture Patterns

### Backend (api/)

**Authentication & OAuth Flow**
- OAuth-only (no passwords). State tokens stored in Redis with 10min TTL via `OAuthStateManager` ([oauth_service.py](../api/services/oauth_service.py))
- **X/Twitter:** Uses PKCE flow (code_verifier stored in Redis, never sent to client). Requires `offline.access` scope for refresh tokens.
- **Facebook:** Standard OAuth2, no PKCE needed.
- **Sessions:** JWT access tokens (15min) + HttpOnly refresh cookies (7 days). Refresh token uses separate `REFRESH_SECRET_KEY` (never same as access token key).
- `UserContext` dataclass from [deps.py](../api/deps.py) provides `user: User` and `session_id: UUID` to all protected endpoints.
- Session validation on every request: checks `expires_at`, `revoked_at`, and validates session exists in DB (enables revocation).
- **Auto-registration:** User created on first OAuth login if doesn't exist (creates User + SocialAccount automatically).

**OAuth Flow (High-Level):**
1. Frontend initiates OAuth → Backend returns authorization URL + state (stored in Redis)
2. User logs in with provider → redirected to `/auth/oauth/callback?code=...&state=...`
3. Backend validates state (one-time use, deleted from Redis), exchanges code for provider access token
4. Backend fetches user info (email, name, avatar), creates/updates User + SocialAccount
5. Backend issues JWT (15min) + refresh token + stores SocialSession in DB
6. Frontend stores JWT in localStorage, includes in all requests via Authorization header

**Multi-Car & Driver Transfer Pattern**
- User can own multiple cars. Owner creates car → `CarDriver` entry **NOT yet created**.
- When owner creates first ride for a car → `CarDriver` entry created with owner as driver (`is_active=true`).
- To transfer driving to another user: (1) add user as passenger to ride, (2) their invitation must be ACCEPTED, (3) then transfer driver creates new `CarDriver` record with `is_active=true`, previous driver's record gets `is_active=false` + `revoked_at` timestamp.
- History tracked: `car_drivers` table contains all past and current drivers with timestamps.
- **Safety check:** Can only transfer to someone who is a passenger on that ride (prevents assigning driver who isn't attending).

**Invitation Flow**
- Invitations are ride-specific, not car-specific (same email can be invited to multiple rides).
- Invitation token is one-time use, expires in 24 hours.
- When invitation accepted: `Invitation.status` → ACCEPTED, `Passenger` record created in DB.
- Passenger can then book a specific seat or accept automatic seat assignment.
- Seat position is optional in acceptance (backend assigns first available if not specified).

**Pydantic Schemas**
- Custom base: `BaseModelWithLabels[T]` ([base_models.py](../api/utils/base_models.py))
- Output schemas implement `from_orm_with_labels(cls, obj)` for computed fields (e.g., `owner_name`)
- Example: `CarOut.from_orm_with_labels(car)` in [schemas.py](../api/schemas.py)

**Logging**
- Structured logging via `get_logger(__name__)` ([logging_config.py](../api/utils/logging_config.py))
- JSON output in production, plain text in dev
- Use `logger.info("message", extra={...})` for context fields
- See usage in [auth.py](../api/routers/auth.py)

**Type Safety**
- mypy strict mode enforced ([pyproject.toml](../pyproject.toml))
- All functions require type hints (no `Any` unless necessary)
- Tests excluded from mypy via `exclude = '(^|/)test_.*\.py$'`

### Frontend (frontend/src/)

**Authentication Flow**
- Axios instance ([axios.ts](../frontend/src/api/axios.ts)) auto-appends `Bearer` token from `localStorage`
- On 401, triggers refresh flow (`/auth/refresh`), then retries original request
- Failed refresh dispatches `AUTH_EXPIRED_EVENT` → redirect to `/login?expired=1`
- Queue pattern prevents duplicate refresh requests

**Custom Hooks**
- Data fetching: `useCar()`, `useRide()`, `useInvites()` ([hooks/](../frontend/src/hooks/))
- Return `{ data, loading, error, notFound, ...actions }` objects
- Error handling via `isAxiosError(err)` checks

**Component Patterns**
- Route guards: `<ProtectedRoute>` (requires auth), `<AnonymousRoute>` (redirects if logged in)
- Dev-only routes lazy loaded (see [App.tsx](../frontend/src/App.tsx))
- Seat rendering uses `SeatRenderer` component with position-based layout ([SeatRenderer.tsx](../frontend/src/components/SeatRenderer.tsx))

**UI Patterns - Four Consistent Approaches**
1. **Skeleton Loading:** Replace spinners with shape-matching skeleton screens (`animate-pulse`). Components: `RideCardSkeleton`, `CarCardSkeleton`, `PassengerListSkeleton`, `SeatRendererSkeleton`.
2. **Optimistic UI + Rollback:** Changes appear immediately in UI. Automatically revert if backend fails. Applies to: seat booking, invitation accept/reject, driver transfer, ride cancellation, booking cancellation.
3. **Button Feedback:** Every async action button must: (a) disable immediately, (b) show loading state ("Ukládám..."), (c) display toast success/error. Pattern: `const [submitting, setSubmitting] = useState(false)` → `disabled={submitting}` → `finally { setSubmitting(false) }`.
4. **Async Action Timeout + User Feedback:** Long-running actions (navigation, redirects, complex requests) must show feedback after N seconds:
   - **Timeout pattern:** Set timeout at action start (e.g., 5-10s) → show loading indicator + message ("Connecting...", "Saving...")
   - **No isMounted guards:** Allow response handlers to execute even after component unmounts (cleanup may interfere)
   - **No automatic cleanup:** Don't clear timeouts in cleanup function; let response handler finish
   - **Error fallback:** If timeout expires before response, show error toast + fallback action
   - **Example:** OAuth callback shows splash screen, loader appears after 2.5s if still loading, error after 10s timeout

**Form Validation**
- Zod schemas in `utils/validation.ts` for client-side validation (before sending to backend)
- react-hook-form with `@hookform/resolvers/zod` for state management
- Failing Zod validation prevents request; error displays inline at field
- Schemas: `carSchema`, `rideSchema`, `inviteSchema`, `seatSchema`

**Styling**
- Tailwind CSS v4 with dark mode support: `dark:` variants for all components
- Primary color: `violet-700` (#7c3aed) for better contrast in dark/light modes
- Toast notifications via `react-toastify`
- Dark mode toggle in Settings → persists in `localStorage.getItem('theme')`

**Page Structure**
- `/login` — OAuth (Facebook/X buttons)
- `/auth/callback` — OAuth callback handler
- `/rides` — List upcoming rides (main page)
- `/rides/new` — Create new ride
- `/rides/:id` — Ride detail + SeatRenderer + passengers
- `/cars` — My cars list
- `/cars/new` — Create car
- `/cars/:id` — Car detail + edit
- `/settings` — Profile, dark mode toggle, logout
- Dev-only: `/test-seats`, `/demo-seats`, `/position-test`, `/dialogs` (gated by `import.meta.env.MODE === 'development'`)

## Developer Workflows

### Backend Commands (from root)
```bash
make run      # Start FastAPI dev server (uvicorn --reload, :8000)
make format   # Run black, isort, flake8, mypy
make test     # Run pytest (api/tests/) with happy/edge markers
```

**API Documentation (Development Only)**
- **Swagger UI:** http://localhost:8000/docs — Interactive API endpoints
- **ReDoc:** http://localhost:8000/redoc — Alternative API documentation
- **OpenAPI JSON:** http://localhost:8000/openapi.json — Raw schema
- Only available in `development` environment; disabled in production

### Frontend Commands (from frontend/)
```bash
npm run dev        # Vite dev server (:5173)
npm run build      # Production build + PWA manifest generation
npm run typecheck  # TypeScript check w/o emit
npm run lint       # ESLint check
```

**Dev-Only Pages (gated by `import.meta.env.MODE === 'development'`)**
- **Storybook-like pages** accessible during development:
  - `/test-seats` — SeatRenderer test page
  - `/demo-seats` — SeatRenderer demo
  - `/position-test` — Seat position testing
  - `/dialogs` — Dialog component examples
- Create new dev page in `frontend/src/pages/`, lazy-load in [App.tsx](../frontend/src/App.tsx)

**Database Migrations**
```bash
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                              # Apply migrations
```

**Local Development**
- Start services: `docker-compose up redis db` (PostgreSQL on :5432, Redis on :6379)
- Backend runs on :8000, frontend on :5173
- See [README.md](../README.md) for OAuth app setup (Facebook/X)

**Testing**
- Backend: `pytest api/tests/` with markers `@pytest.mark.happy` and `@pytest.mark.edge`
- Frontend: Selenium tests (planned in `selenium/` directory)
- PWA validation: Chrome DevTools → Application → Manifest, Lighthouse audit

## Key Files Reference

| File | Purpose |
|------|---------|
| [api/main.py](../api/main.py) | FastAPI app setup, CORS, rate limiting, router registration |
| [api/models.py](../api/models.py) | SQLAlchemy models (User, Car, Ride, Invitation, etc.) |
| [api/deps.py](../api/deps.py) | `get_current_user()` dependency, `UserContext` dataclass |
| [api/config.py](../api/config.py) | Pydantic settings with validation (OAuth keys, JWT secrets) |
| [api/schemas.py](../api/schemas.py) | Pydantic output schemas with `from_orm_with_labels()` pattern |
| [api/services/oauth_service.py](../api/services/oauth_service.py) | OAuth clients (Facebook, X) and state management |
| [api/routers/auth.py](../api/routers/auth.py) | OAuth callbacks, token refresh, session revocation |
| [api/routers/cars.py](../api/routers/cars.py) | Car CRUD, car driver transfer, multi-car logic |
| [api/routers/rides.py](../api/routers/rides.py) | Ride creation, passenger management, seat booking |
| [frontend/src/api/axios.ts](../frontend/src/api/axios.ts) | Axios interceptors for auth token refresh + queue pattern |
| [frontend/src/App.tsx](../frontend/src/App.tsx) | React Router v7 setup, auth expiry handler, dev route loading |
| [frontend/src/utils/validation.ts](../frontend/src/utils/validation.ts) | Zod schemas for client-side form validation |
| [frontend/src/components/SeatRenderer.tsx](../frontend/src/components/SeatRenderer.tsx) | Interactive seat selection UI (unchanged from design) |

## Critical Architectural Decisions

**Why CarDriver is Created On-Demand**
CarDriver entries are not created when a car is created, only when the owner creates their first ride. This avoids polluting the database with unused CarDriver records and keeps the logic simple: "If you create a ride, you're implicitly the driver."

**Why Invitations Are Ride-Specific**
Invitations are tied to individual rides, not cars. This allows the same person to be invited to multiple rides in the same car without conflicts, and makes seat assignment ride-specific.

**Why Seat Position Is Optional on Invitation Accept**
When a passenger accepts an invitation, they don't have to specify a seat. The backend assigns the first available seat automatically. This reduces friction for users while still allowing them to change seats later on the ride detail page.

**Why OAuth State Is Stored in Redis**
State tokens are stored in Redis with 10-minute TTL for:
- One-time use (deleted after validation)
- Automatic cleanup (TTL expiration)
- Speed (Redis vs DB for CSRF token checks)
- PKCE code_verifier storage (X/Twitter specific)

## Conventions

**Naming**
- Backend: snake_case (Python PEP 8)
- Frontend: camelCase (TypeScript), PascalCase (components)
- Enums: `CarLayout.SEDAQ` (uppercase enum values, string-based)

**Language**
- Code: English (variables, functions, comments in code files)
- UI strings: Czech (toast messages, form labels, error text)
- Comments in routers/services: mix of Czech explanations and English technical terms

**Testing**
- Backend: pytest with markers `@pytest.mark.happy` and `@pytest.mark.edge`
- Frontend: no test framework currently configured

**Environment Variables**
- Required: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `REFRESH_SECRET_KEY`, `FACEBOOK_CLIENT_ID/SECRET`, `X_CLIENT_ID/SECRET`, `FRONTEND_ORIGIN`
- See [.env.example](../.env.example) for full list (if exists)

**Role-Based Access & Use Cases**

| Use Case | Roles | Constraints |
|----------|-------|------------|
| Create car | Owner | Any user can create cars |
| Create ride | Owner | Car owner creates ride, becomes initial driver |
| Invite passenger | Owner/Driver | Only owner or current driver can invite |
| Accept invitation | Invited user | Must have received invitation token for ride |
| Book seat | Passenger | Must be a passenger on the ride |
| Transfer driver | Owner | Only owner can transfer, new driver must be passenger on ride |
| View ride | Passenger/Driver | Only participants and owner can view |
| Cancel ride | Owner | Only owner can cancel |
## Frontend-Backend Inconsistencies & Fixes

⚠️ **Status Summary:**
- ✅ **#1** — FIXED: GET /rides/ now shows owner's rides
- ℹ️ **#2** — BY DESIGN: Seat position required in POST /book (different from optional on invitation accept)
- ✅ **#3** — FIXED: POST /accept returns RideOut
- ✅ **#4** — HANDLED: GET /invitations/received returns empty for X users without email
- ✅ **#5** — FIXED: POST /reject returns InvitationOut
- ✅ **#6** — FIXED: Invitations expire in 24 hours (not 7 days)

### Former Issue #1 (FIXED) — GET /rides/ Now Includes Owner's Rides
**Previous:** Backend returned rides where user was passenger only.  
**Fixed in:** [rides.py:72-96](../api/routers/rides.py#L72-L96)  
**Solution:** Query uses `or_()` to include rides where:
- User is car owner (`Car.owner_id == user_id`), OR
- User is passenger (`Passenger.user_id == user_id`)

### Issue #2 (BY DESIGN) — POST /rides/{ride_id}/book Requires Seat Position
**Design:** Seat position is required when user explicitly books a seat (after already being a passenger).  
**Compare:** In `POST /invitations/{token}/accept`, seat position is optional (system auto-assigns).  
**Rationale:** Different UX flows — invitations are one-click passive acceptance, seat booking is explicit action.

### Former Issue #3 (FIXED) — POST /invitations/{token}/accept Now Returns RideOut
**Previous:** Returned `UserOut` (confusing after accepting ride invitation).  
**Fixed in:** [invitations.py:112-200](../api/routers/invitations.py#L112-L200)  
**Solution:** Endpoint now returns complete `RideOut` with updated passenger list and seat layout.

### Former Issue #4 (HANDLED) — GET /invitations/received Safe for X Users
**Previous:** Crashed if user.email was NULL (X/Twitter).  
**Fixed in:** [invitations.py:18-27](../api/routers/invitations.py#L18-L27)  
**Solution:** Returns empty list `[]` if user has no email (safe for X users).  
**Long-term:** Consider adding FK `invitation_user_id` to decouple from email-based filtering.

### Former Issue #5 (FIXED) — POST /invitations/{token}/reject Returns InvitationOut
**Previous:** Returned `{"detail": "..."}` string.  
**Fixed in:** [invitations.py:210-223](../api/routers/invitations.py#L210-L223)  
**Solution:** Now returns structured `InvitationOut` with `status=REJECTED` for consistency.

### Former Issue #6 (FIXED) — Invitations Expire in 24 Hours
**Previous:** Invitations expired in 7 days.  
**Fixed in:** [rides.py:317](../api/routers/rides.py#L317)  
**Solution:** Changed `timedelta(days=7)` → `timedelta(hours=24)`
## Common Pitfalls

1. **Don't** use `model_validate()` directly on SQLAlchemy models for output schemas—call `from_orm_with_labels()` to get computed fields
2. **Don't** forget `db.commit()` after database writes; sessions don't auto-commit ([database.py](../api/database.py))
3. **Don't** use legacy `Column()` syntax—always use `Mapped[Type]` with `mapped_column()`
4. **Don't** hardcode seat positions—use enum values from [enums.py](../api/utils/enums.py) and position logic from frontend utils
5. **Always** include `extra={"key": "value"}` when logging context via structured logger
6. **Don't** store provider OAuth tokens in Pydantic outputs—tokens remain in `SocialSession` only (never exposed to frontend)
7. **Don't** create CarDriver on car creation—only create it when first ride is created
8. **Ensure** only one `is_active=true` CarDriver per car by rotating with `revoked_at` timestamps
9. **Always validate** that transfer-driver target is a passenger on the ride before allowing transfer
10. **Remember** Invitations are ride-specific; use `ride_id` FK, not `car_id`
11. **Timeout + Loader Pattern - Gotchas:** (a) `isMounted` checks in response handlers block setState→renders never happen, (b) cleanup functions clearing timeouts prevent late updates, (c) `fixed inset-0 z-50` overlays hide content beneath, (d) no cleanup in useEffect—let timeouts fire naturally. **Right way:** Set timeout at start, show UI after N seconds, let response execute regardless of mount state, navigate only in response handler (not before).

