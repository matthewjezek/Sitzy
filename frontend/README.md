# Sitzy Frontend

Postaven na React 19, TypeScript, Vite a Tailwind CSS v4.

## Vývoj

```bash
npm run dev      # Spustit Vite dev server (:5173)
npm run build    # Produkční build s PWA manifestem
npm run typecheck # TypeScript validace
npm run lint     # ESLint kontrola
```

## Známé problémy

### Zranitelnost vite-plugin-pwa

`vite-plugin-pwa@1.2.0` (poslední verze) má tranzitivní zranitelnost
přes `serialize-javascript` v build toolingu:

- **Závažnost:** Vysoká (remote code execution v buildu/bundlování)
- **Úroveň rizika:** Nízká pro produkci (pouze v čase buildu, ne v běhu aplikace)
- **Stav:** Čekáme na opravy v `vite-plugin-pwa` a `workbox-build`

Jedná se o zranitelnost v čase buildu, která ovlivňuje vývojový/CI pipeline,
ne bezpečnost běhu aplikace. Uživatelé a nasazené aplikace nejsou ohroženy.

**Možná řešení:**

1. ✅ **Současný přístup:** Přijmout zranitelnost v buildě, zatímco PWA zůstává důležitá
2. Downgradovat na starší PWA plugin (nedoporučeno — zavádí více bezpečnostních
problémů)
3. Odstranit PWA funkčnost úplně (nežádoucí)

Sleduj
[vite-plugin-pwa releases](https://github.com/vite-pwa/vite-plugin-pwa/releases)
pro aktualizace.
