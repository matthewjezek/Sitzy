import { useEffect } from 'react'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Zásady ochrany osobních údajů - Sitzy'
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Zásady ochrany osobních údajů
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
        </div>

        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-8">
          <h2 className="text-red-800 dark:text-red-200 font-bold text-lg mb-2">
            Upozornění: Akademický projekt (Bakalářská práce)
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm">
            Tato aplikace ("Sitzy") není komerčním produktem a není určena pro veřejnost. 
            Jedná se výhradně o studentský projekt vytvořený pro účely obhajoby bakalářské práce. 
            Aplikace neposkytuje reálné přepravní služby. Veškerá data jsou shromažďována 
            pouze za účelem demonstrace technického řešení a budou po obhajobě trvale smazána.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              1. Úvod
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Sitzy je webová aplikace pro koordinaci sdílených jízd. Chováme se zodpovědně s vašimi osobními údaji.
              Tyto zásady vysvětlují, jaké údaje sbíráme, proč je sbíráme a jaká máte práva.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              2. Jaké údaje sbíráme?
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.1 Údaje z OAuth přihlášení</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Když se přihlásíte přes Facebook nebo X (Twitter), sbíráme:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2">
                  <li>Unikátní ID z poskytovatele</li>
                  <li>Jméno a profilový obrázek</li>
                  <li>Email (pokud je dostupný)</li>
                  <li>Přístupový token pro relaci</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.2 Údaje o jízdách a automobilech</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Když používáte aplikaci, vytváříme:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2">
                  <li>Záznam o automobilech, která vytvoříte</li>
                  <li>Záznam o jízdách a jejich účastnících</li>
                  <li>Pozvánky a přijatí pozvaní</li>
                  <li>Přiřazené sedačky a pozice</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.3 Technické údaje</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Sbíráme základní technické informace:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2">
                  <li>Časy přihlášení a odhlášení</li>
                  <li>Údaje o relacích (session tokens)</li>
                  <li>Chybové zprávy a logy (bez osobních údajů)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3. Jak používáme vaše údaje?
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Zajistit funkčnost aplikace (správa jízd, účastníků)</li>
              <li>Autentifikace a bezpečnost vašeho účtu</li>
              <li>Zlepšování aplikace a fixování chyb</li>
              <li>Komunikace s vámi (pokud je nezbytná)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              4. Jak dlouho se údaje uchovávají?
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vaše data uchovávame dokud máte aktivní účet. Když svůj účet smažete:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Všechny osobní údaje jsou smazány</li>
              <li>Data o vašich jízdách a automobilech jsou smazána</li>
              <li>Pozvánky a položky v seznamech jsou smazány</li>
              <li>Bezpečnostní logy se smažou po 30 dnech</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              5. Sdílení údajů
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vaše údaje nesdílíme s žádnými třetími stranami. V rámci aplikace jsou data o konkrétní jízdě viditelná pouze pro:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Vlastník automobilu (tvůrce jízdy)</li>
              <li>Řidič jízdy</li>
              <li>Ostatní účastníci stejné jízdy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              6. Vaša práva
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Máte právo na:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li><strong>Přístup</strong> — vidět jaká data o vás máme</li>
              <li><strong>Opravu</strong> — opravit nepřesné informace</li>
              <li><strong>Smazání</strong> — smazat svůj účet a všechna data (je dostupné v Nastavení)</li>
              <li><strong>Portabilitu</strong> — získat vaše data v přenositelné formě</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              7. Bezpečnost
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vaše údaje jsou chráněny:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Šifrovanou komunikací (HTTPS)</li>
              <li>Bezpečnými hesly a tokeny (JWT)</li>
              <li>Bezpečnou databází s omezeným přístupem</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              8. Cookies a sledování
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Používáme minimální cookies:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Session token pro vaši přihlášení (HttpOnly, Secure)</li>
              <li>Předvolby tématu (light/dark mode) v localStorage</li>
              <li>Nepoužíváme analytics ani reklamní tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              9. Kontakt
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Máte-li dotazy ohledně ochrany vašich osobních údajů, kontaktujte nás:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                info@sitzy.page
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              10. Změny v těchto zásadách
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Můžeme tyto zásady změnit. Aktuální verzi si můžete vždy přečíst zde.
              Oznámíme vám o důležitých změnách emailem.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
