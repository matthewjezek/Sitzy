import { useEffect } from 'react'

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Podmínky použití - Sitzy'
  }, [])

  return (
    <div className="page-container flex-col items-center py-12 px-4">
      <div className="page-content max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Podmínky použití
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-8">
          <h2 className="text-yellow-800 dark:text-yellow-200 font-bold text-lg mb-2">
            Upozornění: Akademický projekt (Bakalářská práce)
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Tato aplikace ("Sitzy") není komerčním produktem a není určena pro veřejnost. 
            Jedná se výhradně o studentský projekt vytvořený pro účely obhajoby bakalářské práce. 
            Aplikace neposkytuje reálné přepravní služby. Veškerá data jsou shromažďována 
            pouze za účelem demonstrace technického řešení a budou po obhajobě trvale smazána.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              1. Přijetí podmínek
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Používáním Sitzy souhlasíte s těmito podmínkami. Pokud nesouhlasíte, prosím, nepoužívejte aplikaci.
              Vyhrazujeme si právo na změny těchto podmínek. Používáním aplikace po změně projevujete souhlas s novými podmínkami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              2. Účel služby
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Sitzy je webová aplikace pro koordinaci sdílených jízd mezi osobami. Umožňuje vytvářet jízdy,
              zvát účastníky, spravovat sedačky a komunikovat se spolujetci.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3. Registrace a účet
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Používáte OAuth přihlášení (Facebook nebo X). Jste zodpovědní za:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Bezpečnost vašeho účtu u poskytovatele OAuth</li>
              <li>Všechny aktivity pod vaším účtem v Sitzy</li>
              <li>Neposkytování přístupu třetím osobám</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              4. Vaše povinnosti uživatele
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Souhlasíte s tím, že:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-2">
              <li><strong>Dodržíte zákony</strong> — nebudete porušovat místní ani státní zákony</li>
              <li><strong>Budete počestný</strong> — nebudete poskytovat falešné informace o sobě nebo jízdách</li>
              <li><strong>Budete bezpečný řidič</strong> — jízdy budete vytvářet a účastnit se jich odpovědně</li>
              <li><strong>Budete respektovat ostatní</strong> — nebudete obtěžovat, zneužívat nebo diskriminovat ostatní uživatele</li>
              <li><strong>Nebudete vandalizovat</strong> — nebudete pokoušet se hacknout nebo zneužívat aplikaci</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              5. Omezení odpovědnosti
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
              Sitzy poskytuje aplikaci "tak jak je" bez záruk.
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.1 Odpovědnost za bezpečnost</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Sitzy není odpovědný za:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                  <li>Nehody nebo incidenty během jízd</li>
                  <li>Chování ostatních účastníků</li>
                  <li>Škody na zdraví nebo majetku</li>
                  <li>Ztrátu nebo krádež osobních věcí</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.2 Odpovědnost za dostupnost</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Negarantujeme nepřetržitou dostupnost. Aplikace může být dočasně nedostupná kvůli:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                  <li>Údržbě a aktualizacím</li>
                  <li>Problémům se servery</li>
                  <li>Síťovým výpadkům</li>
                  <li>Problémům s poskytovateli třetích stran</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.3 Ručení za údaje</h3>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  V maximální míře povolené zákonem není Sitzy odpovědný za ztrátu nebo poškození dat.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              6. Zákaz a vynucování
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vyhrazujeme si právo deaktivovat účty, které porušují tyto podmínky. To zahrnuje:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Opakované porušování pravidel</li>
              <li>Harcení, zneužívání nebo diskriminace</li>
              <li>Pokusy o hackování nebo zneužití</li>
              <li>Podvodné nebo nelegální chování</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              7. Duševní vlastnictví
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Sitzy a všechny její součásti (design, kód, obsah) jsou chráněny právem na duševní vlastnictví.
              Nemáte právo kopírovat, distribuovat nebo modifikovat aplikaci bez svolení.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-3">
              Obsah, který vytvoříte (jízdy, komentáře) zůstává vaší vlastností.
              Poskytujete nám licenci k zobrazování a uchovávání tohoto obsahu v aplikaci.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              8. Externí odkazy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Sitzy může obsahovat odkazy na externí weby. Nejsme odpovědní za obsah, bezpečnost
              nebo práva třetích osob na těchto webech.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              9. Právní rámec
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Tyto podmínky podléhají právům České republiky a jsou upravovány podle českého právního řádu.
              Všechny spory budou řešeny v souladu s právem České republiky.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              10. Omezení odpovědnosti — Poplatek omezení
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Bez ohledu na typ nároku nebo teorii odpovědnosti (smluvní, mimosmluvní, deliktu),
              celková odpovědnost Sitzy nebo jeho poskytovatelů nebude překročit 0 CZK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              11. Smazání účtu
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Svůj účet můžete smazat kdykoliv v Nastavení. Při smazání budou vymazány všechny vaše údaje.
              Toto se nedá vrátit zpět. Data o jízdách, kterých jste účastníkem, zůstanou dostupná ostatním účastníkům.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              12. Kontakt
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Máte-li otázky o těchto podmínkách, kontaktujte nás:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                info@sitzy.page
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
