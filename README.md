# 🇨🇿 Sitzy

**Sitzy** je webová aplikace pro správu pasažérů a rozložení sedaček v autě.
Umožňuje snadno naplánovat, kdo kde sedí, a sdílet schéma auta s ostatními
účastníky jízdy.

## 🚗 Hlavní funkce

- Interaktivní rozložení sedaček podle typu vozidla (sedan, kupé, minivan)
- Vytváření událostí (jednorázové jízdy)
- Přidávání a správa pasažérů včetně přehledu, kdo kde sedí
- Sdílení přístupu pomocí uživatelského ID (např. e-mail)
- Možnost připojení k více autům jako host

## 🧪 Prototypové vlastnosti (v plánu)

- Přátelský seznam pro snadnější pozvání známých
- Volitelná identifikace řidiče
- Easter egg režim „Sedaq“ pro vývojáře 😉

## 🧰 Použité technologie (předběžné)

- [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- (volitelné) Firebase / Supabase pro správu dat

## ▶️ Lokální spuštění (zatím návrh)

```bash
git clone https://github.com/uzivatel/sitzy.git
cd sitzy
npm install
npm run dev
```

## OAuth Setup

### Lokální spuštění s Redisem

```bash
docker-compose up redis
```

### Facebook App registrace

1. Jdi na [developers.facebook.com](https://developers.facebook.com)
2. Vytvoř novou aplikaci → **Consumer**
3. Přidej produkt **Facebook Login**
4. Nastav **Valid OAuth Redirect URIs**:
   - Dev: `http://localhost:5173/auth/callback`
   - Prod: `https://yourdomain.com/auth/callback`
5. Zkopíruj `App ID` → `FACEBOOK_CLIENT_ID`
6. Zkopíruj `App Secret` → `FACEBOOK_CLIENT_SECRET`

### X (Twitter) App registrace

1. Jdi na [developer.twitter.com](https://developer.twitter.com)
2. Vytvoř nový projekt + aplikaci
3. Nastav **OAuth 2.0** → **Type of App: Web App**
4. Nastav **Callback URI**:
   - Dev: `http://localhost:5173/auth/callback`
   - Prod: `https://yourdomain.com/auth/callback`
5. Povol **Read** permissions
6. Zkopíruj `Client ID` → `X_CLIENT_ID`
7. Zkopíruj `Client Secret` → `X_CLIENT_SECRET`

### Generování SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Spusť dvakrát – jednou pro `SECRET_KEY`, jednou pro `REFRESH_SECRET_KEY`.
