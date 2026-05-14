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

### Technologický stack (CZ)

#### Backend (CZ)

- **Framework**: FastAPI (Python 3.11+)
- **Databáze**: PostgreSQL s SQLAlchemy 2.0 (ORM)
- **Migrace**: Alembic
- **Cache/Session**: Redis (stav OAuth a správa relací)
- **Zabezpečení**: JWT (Access/Refresh tokeny), PKCE pro OAuth přes X (Twitter)

#### Frontend (CZ)

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Sestavení**: Vite
- **Správa stavu**: Vlastní hooky s Axios pro komunikaci s API
- **Validace**: Zod + React Hook Form

#### DevOps a nástroje (CZ)

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

#### Nastavení Backendů (CZ)

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

#### Nastavení Frontendu (CZ)

1. Přejděte do adresáře `frontend`.
2. Nainstalujte závislosti:

   ```bash
   npm install
   ```

3. Spusťte vývojový server:

   ```bash
   npm run dev
   ```

### Konfigurace OAuth (CZ)

#### Registrace aplikace na Facebooku (CZ)

1. Navštivte [developers.facebook.com](https://developers.facebook.com).
2. Vytvořte novou aplikaci s využitím "Authenticate and request data from users
   with Facebook Login".
3. V sekci **App Settings -> Basic** získejte své `App ID` a `App Secret`.

#### Registrace aplikace na X (Twitteru) (CZ)

1. Navštivte [developer.twitter.com](https://developer.twitter.com).
2. Vytvořte nový Project a App.
3. Povolte **User authentication settings** s OAuth 2.0.
4. Nastavte **Callback URI** na `http://localhost:5173/auth/callback`.

#### Bezpečnostní klíče (CZ)

Vygenerujte silné tajné klíče pro JWT:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Spusťte dvakrát pro vygenerování `SECRET_KEY` a `REFRESH_SECRET_KEY` do vašeho
souboru `.env`.

### Struktura projektu (CZ)

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

### Technical Stack (EN)

#### Backend (EN)

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy 2.0 (ORM)
- **Migrations**: Alembic
- **Caching/Session**: Redis (OAuth state and session management)
- **Security**: JWT (Access/Refresh tokens), PKCE for X/Twitter OAuth

#### Frontend (EN)

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

#### Infrastructure (EN)

Start the required services (PostgreSQL, Redis):

```bash
docker-compose up -d db redis
```

#### Backend Setup (EN)

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

#### Frontend Setup (EN)

1. Navigate to the `frontend` directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

### OAuth Configuration (EN)

#### Facebook App Registration (EN)

1. Visit [developers.facebook.com](https://developers.facebook.com).
2. Create a new app with "Facebook Login".
3. Retrieve your `App ID` and `App Secret` from settings.

#### X (Twitter) App Registration (EN)

1. Visit [developer.twitter.com](https://developer.twitter.com).
2. Create a new Project and App.
3. Enable OAuth 2.0 and set **Callback URI** to
   `http://localhost:5173/auth/callback`.

### Project Structure (EN)

- `/api`: FastAPI backend source code.
- `/frontend`: React frontend source code.
- `/alembic`: Database migration scripts.
- `/diagrams`: Architecture and data model diagrams.
- `/docs`: Additional documentation.
