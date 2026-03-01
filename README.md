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
2. Vytvoř novou aplikaci → use case **Authenticate and request data
from users with Facebook Login**
3. Zvol **"I don't want to connect a business portfolio yet."**
4. Jdi do **App Settings → Basic**
5. Zkopíruj `App ID` → `FACEBOOK_CLIENT_ID`
6. Zkopíruj `App Secret` → `FACEBOOK_CLIENT_SECRET`

> **Poznámka:** V development módu jsou `http://localhost` redirect URI
> povoleny automaticky – není potřeba je přidávat ručně.
>
> **Business verification + App Review** jsou vyžadovány pouze pro produkční
přístup k datům cizích uživatelů.
Pro vývoj a testování (vlastní účet + max 25 testerů) není potřeba.

### X (Twitter) App registrace

1. Jdi na [developer.twitter.com](https://developer.twitter.com)
2. Vytvoř nový **Project** + **App**
3. V nastavení aplikace najdi **User authentication settings** → **Set up**
4. Vyplň:
   - **App permissions**: Read
   - **Type of App**: Web App, Automated App or Bot
   - **Callback URI**: `http://localhost:5173/auth/callback`
   - **Website URL**: `http://localhost:5173`
5. Ulož nastavení
6. Jdi do **Keys and Tokens** → sekce **OAuth 2.0 Client ID and Client Secret**
7. Zkopíruj `Client ID` → `X_CLIENT_ID`
8. Zkopíruj `Client Secret` → `X_CLIENT_SECRET`

> **Poznámka:** Na rozdíl od Facebooku X nevyžaduje localhost automaticky –
> Callback URI musíš přidat ručně.
>
> **Pozor:** X vygeneruje oba klíče nadepsané jako "Client Secret".
> `Client ID` je kratší řetězec (cca 20–30 znaků),
> `Client Secret` je delší.

### Generování SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Spusť dvakrát – jednou pro `SECRET_KEY`, jednou pro `REFRESH_SECRET_KEY`.
