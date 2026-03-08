# Accessibility Guidelines — Sitzy

## Pravidla pro label a ARIA atributy

### Formulářové prvky

| Situace | Řešení | Příklad |
| ------- | ------ | ------- |
| `input/select/textarea` má viditelný text | Použít `<label>` s explicitním`htmlFor` | `<label htmlFor="email">E-mail</label><input id="email" />` |
| Input je uvnitř labelu | Použít wrapping label (automatická asociace) | `<label>Název <input type="text" /></label>` |
| Input NEMÁ viditelný label | NIKDY jen placeholder, vždy `aria-label` | `<input type="email" aria-label="E-mail uživatele" placeholder="email@..." />` |
| Radio/checkbox skupina | Použít `<fieldset>` + `<legend>` nebo wrapping label | Viz CreateCarPage.tsx řádek 95 |

### Icon-only controls

| Situace | Řešení | Příklad |
| ------- | ------ | ------- |
| Tlačítko s ikonou a textem | Text je dostačující, ikonu označit `aria-hidden="true"` | `<button><FiEdit aria-hidden="true" />Upravit</button>` |
| Tlačítko JEN s ikonou | Použít `aria-label` s popisem akce | `<button aria-label="Zavřít"><FiX aria-hidden="true" /></button>` |
| Logo jako navigační odkaz | `aria-label` na linku, `alt=""` + `aria-hidden` na img | `<Link aria-label="Domů"><img alt="" aria-hidden /></Link>` |
| Dekorativní SVG/ikona | `aria-hidden="true"` | `<FiChevronRight aria-hidden="true" />` |

### Interaktivní prvky

| Situace | Řešení | Příklad |
| ------- | ------ | ------- |
| Klikací `div`/`span` | VŽDY nahradit za `<button>` | ❌ `<div onClick={...}>` → ✅ `<button onClick={...}>` |
| Custom widget (seats) | Dynamické `aria-label` podle stavu | `aria-label={isDriver ? 'Řidič - nedostupné' : 'Sedadlo 3: Volné'}` |
| Toggle button | `aria-pressed={isActive}` | `<button aria-pressed={theme === 'dark'}>Tmavý</button>` |
| Dropdown/menu trigger | `aria-expanded={isOpen}` + `aria-controls="menu-id"` | `<button aria-expanded={open} aria-controls="dropdown">Menu</button>` |
| Dialog | `aria-labelledby` na dialog, odkazující na titulek | `<dialog aria-labelledby="dialog-title"><h2 id="dialog-title">...</h2></dialog>` |

### Stavové a skupinové prvky

| Situace | Řešení | Příklad |
| ------- | ------ | ------- |
| Skupina přepínačů (theme) | `<fieldset>` + `<legend>` NEBO `role="group"` + `aria-label` | `<div role="group" aria-label="Motiv"><button aria-pressed={...}>...</button></div>` |
| Dynamický badge/count | `aria-live="polite"` + `aria-atomic="true"` | `<span aria-live="polite" aria-atomic="true">{count}</span>` |
| Card s akčním tlačítkem | Context v `aria-label` (ne jen "Zobrazit") | `<button aria-label="Zobrazit jízdu: Praha, 15:00">...</button>` |

## Jazyk popisků

- **Česky** ve všech ARIA a label textech (konzistentně s UI).
- **Stručně a jasně**: "Zavřít dialog", ne "Tlačítko pro zavření dialogu".
- **Kontext u akcí**: "Smazat auto: Fabián", ne jen "Smazat".

## Princip "Native HTML First"

1. **Priorita**: `<button>`, `<label>`, `<fieldset>` před ARIA workaroundy.
2. **ARIA se používá JEN když**: native HTML prvek neexistuje nebo nestačí
(custom widgets).
3. **Dekorace**: Vždy označit `aria-hidden="true"` na čistě vizuální prvky.

## Workflow pro opravy

1. Spustit `npm run a11y:lint` → identifikovat problémy.
2. Opravit podle tabulek výše.
3. Znovu spustit `npm run a11y:lint` → ověřit, že problém zmizel.
4. Commit → push → GitHub Actions ověří automaticky.

## Nástroje

| Příkaz | Účel |
| ------ | ---- |
| `npm run a11y:lint` | Statická kontrola (fail při warnings) |
| `npm run a11y:audit` | Runtime audit (placeholder - vyžaduje dev server) |
| `npm run a11y` | Agregovaná lokální kontrola |
| `npm run a11y:ci` | CI režim (fail-fast pro GitHub Actions) |

## Testování před commitem

1. **Keyboard**: Tab na všechny interaktivní prvky, Enter/Space aktivace.
2. **Screen reader** (NVDA): fokus→čtení názvu→akce.
3. **Nástroje**: `npm run a11y:lint` (lokálně), GitHub Actions (po push).

## Reference soubory (správný pattern)

- **Labels u inputů**: [CreateRidePage.tsx](src/pages/CreateRidePage.tsx#L93)
— explicitní label + htmlFor
- **Radio wrapping**: [CreateCarPage.tsx](src/pages/CreateCarPage.tsx#L95)
— input uvnitř label
- **Icon aria-label**: [Navigation.tsx](src/components/Navigation.tsx#L89)
— close button s aria-label

---
*Vytvořeno pro bakalářskou práci jako důkazní dokument systematického
accessibility auditu.*
