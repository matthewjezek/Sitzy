# Sitzy

Sitzy je projekt bakalářské práce zaměřený na správu pasažérů a plánování
rozložení sedaček v autě pro skupiny přátel. Aplikace umožňuje snadno
koordinovat, kdo kde během společných cest sedí, a sdílet vizuální schéma auta s
ostatními účastníky jízdy.

## Verze v češtině

### Klíčové vlastnosti

- **Interaktivní rozložení sedaček**: Podpora pro různé typy vozidel včetně
  variant Sedan, Coupé a Minivan.
- **Správa jízd**: Vytváření a správa konkrétních jízd s určením cíle a času
  odjezdu.
- **Koordinace přátel**: Zvaní pasažérů přes e-mail a interaktivní výběr sedadla.
- **Podpora více aut**: Možnost vlastnit více vozidel a účastnit se různých jízd
  jako řidič nebo pasažér.
- **Vizuální přehled**: Reálný náhled na obsazenost auta pro každou naplánovanou
  jízdu.

### Technologický stack

#### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Databáze**: PostgreSQL s SQLAlchemy 2.0 (ORM)
- **Migrace**: Alembic
- **Cache/Session**: Redis (stav OAuth a správa relací)
- **Zabezpečení**: JWT (Access/Refresh tokeny), PKCE pro OAuth přes X (Twitter)

#### Frontend

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Sestavení**: Vite
- **Správa stavu**: Vlastní hooky s Axios pro komunikaci s API
- **Validace**: Zod + React Hook Form

#### DevOps a nástroje

- **Kontejnerizace**: Docker & Docker Compose
- **Testování**: Playwright (E2E), Pytest (Backend)
- **Linting**: Flake8 (Backend), ESLint (Frontend)

### Lokální nastavení

#### Požadavky

- Docker a Docker Compose
- Node.js 20+
- Python 3.11+

#### Infrastruktura

Spusťte potřebné služby (PostgreSQL, Redis):

```bash
docker-compose up -d db redis
```

#### Nastavení Backendů

1. Přejděte do adresáře `api` (nebo kořenového adresáře projektu podle vašeho
   nastavení venv).
2. Nainstalujte závislosti:

   ```bash
   pip install -r requirements.txt
   ```

3. Spusťte databázové migrace:

   ```bash
   alembic upgrade head
   ```

4. Spusťte FastAPI server:

   ```bash
   uvicorn api.main:app --reload
   ```

#### Nastavení Frontendu

1. Přejděte do adresáře `frontend`.
2. Nainstalujte závislosti:

   ```bash
   npm install
   ```

3. Spusťte vývojový server:

   ```bash
   npm run dev
   ```

### Testování a kontrola kvality

Aplikace obsahuje sadu nástrojů pro zajištění kvality kódu a testování:

#### Backend

- **Spuštění testů (Pytest)**:

  ```bash
  pytest api/tests  # nebo 'make test'
  ```

- **Formátování a linting**:

  ```bash
  make format  # Spustí black, isort, flake8 a mypy na adresář api
  ```

#### Frontend

- **Spuštění E2E testů (Playwright)**:

  ```bash
  cd frontend
  npm run test:e2e
  ```

- **Linting a přístupnost (A11y)**:

  ```bash
  cd frontend
  npm run lint  # Statická analýza kódu
  npm run a11y  # Kontrola accessibility (a11y)
  ```

#### Git Pre-commit Hooks

Pro automatické spuštění kontrol před každým commitem nainstalujte
pre-commit hooks:

```bash
npm run prepare  # nebo 'make setup-hooks'
```

### Konfigurace OAuth

#### Registrace aplikace na Facebooku

1. Navštivte [developers.facebook.com](https://developers.facebook.com).
2. Vytvořte novou aplikaci s využitím "Authenticate and request data from users
   with Facebook Login".
3. V sekci **App Settings -> Basic** získejte své `App ID` a `App Secret`.

#### Registrace aplikace na X (Twitteru)

1. Navštivte [developer.twitter.com](https://developer.twitter.com).
2. Vytvořte nový Project a App.
3. Povolte **User authentication settings** s OAuth 2.0.
4. Nastavte **Callback URI** na `http://localhost:5173/auth/callback`.

#### Bezpečnostní klíče

Vygenerujte silné tajné klíče pro JWT:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Spusťte dvakrát pro vygenerování `SECRET_KEY` a `REFRESH_SECRET_KEY` do vašeho
souboru `.env`.

### Struktura projektu

- `/api`: Zdrojový kód backendu (FastAPI).
- `/frontend`: Zdrojový kód frontendu (React).
- `/alembic`: Skripty pro databázové migrace.
- `/diagrams`: Diagramy architektury systému a datového modelu (Mermaid).
- `/docs`: Další dokumentace.

---

## English Version

Sitzy is a thesis project focused on car seat management and passenger
coordination for friend groups. The application allows users to easily plan who
sits where during shared trips and share the visual car scheme with other ride
participants.

### Key Features

- **Interactive Seat Layouts**: Support for multiple vehicle types including
  Sedan, Coupé, and Minivan.
- **Ride Management**: Create and manage concrete ride events with specific
  destinations and departure times.
- **Friend Coordination**: Invite passengers via email and manage their seat
  assignments interactively.
- **Multi-Car Support**: Users can own multiple vehicles and participate in
  various rides as either a driver or a passenger.
- **Visual Overview**: Real-time car occupancy view for every scheduled ride.

### Technical Stack

#### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy 2.0 (ORM)
- **Migrations**: Alembic
- **Caching/Session**: Redis (OAuth state and session management)
- **Security**: JWT (Access/Refresh tokens), PKCE for X/Twitter OAuth

#### Frontend

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **State Management**: Custom hooks with Axios for API communication
- **Validation**: Zod + React Hook Form

### Local Development Setup

#### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Python 3.11+

#### Infrastructure

Start the required services (PostgreSQL, Redis):

```bash
docker-compose up -d db redis
```

#### Backend Setup

1. Navigate to the `api` directory (or project root).
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run database migrations:

   ```bash
   alembic upgrade head
   ```

4. Start the FastAPI server:

   ```bash
   uvicorn api.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

### Testing and Quality Control

Sitzy includes a set of tools to ensure code quality and running tests:

#### Backend

- **Run Tests (Pytest)**:

  ```bash
  pytest api/tests  # or 'make test'
  ```

- **Code Formatting & Linting**:

  ```bash
  make format  # Runs black, isort, flake8, and mypy on the api directory
  ```

#### Frontend

- **Run E2E Tests (Playwright)**:

  ```bash
  cd frontend
  npm run test:e2e
  ```

- **Linting & Accessibility (A11y)**:

  ```bash
  cd frontend
  npm run lint  # Runs ESLint code quality checks
  npm run a11y  # Runs accessibility checks
  ```

#### Git Pre-commit Hooks

To automatically run checks before each commit, set up the
pre-commit hooks:

```bash
npm run prepare  # or 'make setup-hooks'
```

### OAuth Configuration

#### Facebook App Registration

1. Visit [developers.facebook.com](https://developers.facebook.com).
2. Create a new app with "Facebook Login".
3. Retrieve your `App ID` and `App Secret` from settings.

#### X (Twitter) App Registration

1. Visit [developer.twitter.com](https://developer.twitter.com).
2. Create a new Project and App.
3. Enable OAuth 2.0 and set **Callback URI** to
   `http://localhost:5173/auth/callback`.

### Project Structure

- `/api`: FastAPI backend source code.
- `/frontend`: React frontend source code.
- `/alembic`: Database migration scripts.
- `/diagrams`: Architecture and data model diagrams.
- `/docs`: Additional documentation.
