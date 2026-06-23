import { useEffect, useState } from 'react';
import DocHeader from '../components/DocHeader';
import { getInitialLanguage, setStoredLanguage, type Language } from '../utils/language';

export default function TermsPage() {
  const [lang, setLang] = useState<Language>(() => getInitialLanguage());

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  useEffect(() => {
    document.title = lang === 'cs' ? 'Podmínky použití - Sitzy' : 'Terms of Use - Sitzy';
  }, [lang]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <DocHeader lang={lang} setLang={handleLanguageChange} />
      
      <div className="page-container flex-col py-12 px-4 flex-1">
        <div className="page-content max-w-2xl w-full">
          {lang === 'cs' ? (
            // ── CZECH VERSION ──
            <>
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
                  Tato aplikace („Sitzy“) není komerčním produktem a není určena pro veřejnost. 
                  Jedná se výhradně o studentský projekt vytvořený pro účely obhajoby bakalářské práce. 
                  Aplikace neposkytuje reálné přepravní služby. Veškeré údaje jsou shromažďována 
                  pouze za účelem demonstrace technického řešení a budou po obhajobě trvale smazána.
                </p>
              </div>

              <div className="prose dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    1. Přijetí podmínek
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Používáním aplikace Sitzy vyjadřujete souhlas s těmito podmínkami. Pokud s nimi nesouhlasíte, aplikaci prosím nepoužívejte.
                    Vyhrazujeme si právo tyto podmínky kdykoli změnit. Používáním aplikace po provedení změn vyjadřujete souhlas s jejich novým zněním.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    2. Účel služby
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy je webová aplikace určená ke koordinaci sdílených jízd mezi uživateli. Umožňuje zakládat jízdy,
                    zvát účastníky, spravovat obsazenost míst (sedaček) a komunikovat se spolujezdci.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    3. Registrace a účet
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Přihlášení do aplikace probíhá prostřednictvím OAuth (Facebook nebo X). Nesete plnou odpovědnost za:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>zabezpečení svého účtu u příslušného poskytovatele OAuth,</li>
                    <li>veškeré aktivity prováděné pod vaším účtem v aplikaci Sitzy,</li>
                    <li>zabezpečení účtu před přístupem třetích osob.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    4. Povinnosti uživatele
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Používáním aplikace se zavazujete, že:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-2">
                    <li><strong>budete dodržovat zákony</strong> — nebudete porušovat platné právní předpisy,</li>
                    <li><strong>budete jednat čestně</strong> — nebudete uvádět nepravdivé či zavádějící informace o sobě ani o jízdách,</li>
                    <li><strong>budete dbát na bezpečnost</strong> — jízdy budete zakládat a účastnit se jich odpovědně a s ohledem na bezpečnost silničního provozu,</li>
                    <li><strong>budete respektovat ostatní</strong> — nebudete ostatní uživatele obtěžovat, zneužívat ani diskriminovat,</li>
                    <li><strong>nebudete aplikaci poškozovat</strong> — nebudete se pokoušet o neoprávněný přístup, modifikaci nebo zneužití systému.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    5. Omezení odpovědnosti
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
                    Aplikace Sitzy je poskytována „tak, jak je“, bez jakýchkoli záruk.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.1 Odpovědnost za bezpečnost</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Provozovatel aplikace neodpovídá za:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>nehody, škody nebo jakékoli incidenty vzniklé během jízd,</li>
                        <li>chování a jednání ostatních účastníků jízd,</li>
                        <li>škody na zdraví, majetku či nemajetkovou újmu,</li>
                        <li>ztrátu, poškození nebo odcizení osobních věcí.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.2 Odpovědnost za dostupnost</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Negarantujeme nepřetržitou dostupnost aplikace. Systém může být dočasně nedostupný zejména z důvodu:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>plánované údržby a aktualizací,</li>
                        <li>technických potíží na straně serverů,</li>
                        <li>výpadků internetového připojení,</li>
                        <li>výpadků služeb třetích stran.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.3 Odpovědnost za data</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        V maximální míře povolené platnými právními předpisy neodpovídáme za případnou ztrátu, poškození nebo zneužití dat.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    6. Pozastavení a ukončení účtu
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vyhrazujeme si právo bez předchozího upozornění deaktivovat účty, které porušují tyto podmínky. Jedná se zejména o:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>opakované porušování pravidel aplikace,</li>
                    <li>obtěžování, zneužívání nebo diskriminaci ostatních,</li>
                    <li>pokusy o kompromitaci nebo zneužití systému,</li>
                    <li>podvodné či protiprávní chování.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    7. Duševní vlastnictví
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Aplikace Sitzy a veškeré její součásti (vzhled, kód, grafické prvky) jsou chráněny autorským právem a právem duševního vlastnictví.
                    Kopírování, šíření nebo úprava aplikace bez předchozího písemného souhlasu jsou zakázány.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    Obsah, který sami vytvoříte (např. jízdy, komentáře), zůstává vaším vlastnictvím.
                    Odesláním obsahu nám však udělujete bezplatnou licenci k jeho zobrazování a uchovávání v rámci provozu aplikace.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    8. Externí odkazy
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Aplikace může obsahovat odkazy na webové stránky třetích stran. Neodpovídáme za obsah, zásady ochrany soukromí
                    ani bezpečnost na těchto externích webech.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    9. Právní rámec
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Tyto podmínky použití se řídí právním řádem České republiky. Veškeré případné spory budou řešeny před příslušnými soudy České republiky.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    10. Omezení výše odpovědnosti
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Bez ohledu na povahu nároku (smluvní, mimosmluvní nebo jiná odpovědnost) nepřesáhne celková odpovědnost aplikace Sitzy ani jejích poskytovatelů částku 0 Kč.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    11. Smazání účtu
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Smazání účtu můžete provést kdykoli v sekci Nastavení. Při smazání budou trvale vymazány veškeré vaše osobní údaje a tato akce je nevratná.
                    Historické údaje o jízdách, jichž jste se účastnili, však mohou zůstat zobrazeny ostatním dotčeným spolucestujícím.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    12. Kontakt
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Máte-li jakékoli dotazy k těmto podmínkám použití, můžete nás kontaktovat na adrese:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                      info@sitzy.page
                    </a>
                  </p>
                </section>
              </div>
            </>
          ) : (
            // ── ENGLISH VERSION ──
            <>
              <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                Terms of Use
              </h1>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                Last updated: {new Date().toLocaleDateString('en-US')}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-8">
                <h2 className="text-yellow-800 dark:text-yellow-200 font-bold text-lg mb-2">
                  Notice: Academic Project (Bachelor's Thesis)
                </h2>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  This application ("Sitzy") is not a commercial product and is not intended for the public.
                  It is purely a student project created for the purpose of defending a bachelor's thesis.
                  The application does not provide real transportation services. All data is collected
                  solely to demonstrate the technical solution and will be permanently deleted after the thesis defense.
                </p>
              </div>

              <div className="prose dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    By using Sitzy, you agree to these terms. If you do not agree, please do not use the application.
                    We reserve the right to modify these terms. By using the application after a change, you express your agreement with the new terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    2. Purpose of the Service
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy is a web application for coordinating shared rides between individuals. It allows creating rides,
                    inviting participants, managing seats, and communicating with fellow passengers.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    3. Registration and Account
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    You use OAuth login (Facebook or X). You are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>The security of your account with the OAuth provider</li>
                    <li>All activities under your account in Sitzy</li>
                    <li>Not providing access to third parties</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    4. Your Obligations as a User
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    You agree that:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-2">
                    <li><strong>You will comply with the law</strong> — you will not violate local or state laws</li>
                    <li><strong>You will be honest</strong> — you will not provide false information about yourself or rides</li>
                    <li><strong>You will be a safe driver</strong> — you will create and participate in rides responsibly</li>
                    <li><strong>You will respect others</strong> — you will not harass, abuse, or discriminate against other users</li>
                    <li><strong>You will not vandalize</strong> — you will not attempt to hack or exploit the application</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    5. Limitation of Liability
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
                    Sitzy provides the application "as is" without warranties.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.1 Responsibility for Safety</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Sitzy is not responsible for:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>Accidents or incidents during rides</li>
                        <li>Behavior of other participants</li>
                        <li>Health or property damage</li>
                        <li>Loss or theft of personal belongings</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.2 Responsibility for Availability</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        We do not guarantee uninterrupted availability. The application may be temporarily unavailable due to:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>Maintenance and updates</li>
                        <li>Server issues</li>
                        <li>Network outages</li>
                        <li>Issues with third-party providers</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">5.3 Liability for Data</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        To the maximum extent permitted by law, Sitzy is not liable for data loss or corruption.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    6. Suspension and Enforcement
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We reserve the right to deactivate accounts that violate these terms. This includes:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>Repeated rule violations</li>
                    <li>Harassment, abuse, or discrimination</li>
                    <li>Attempted hacking or misuse</li>
                    <li>Fraudulent or illegal behavior</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    7. Intellectual Property
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy and all of its components (design, code, content) are protected by intellectual property rights.
                    You do not have the right to copy, distribute, or modify the application without permission.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    The content you create (rides, comments) remains your property.
                    You grant us a license to display and store this content within the application.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    8. External Links
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy may contain links to external websites. We are not responsible for the content, security,
                    or rights of third parties on these websites.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    9. Legal Framework
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    These terms are governed by and construed in accordance with the laws of the Czech Republic.
                    All disputes will be resolved in accordance with the laws of the Czech Republic.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    10. Limitation of Liability — Liability Cap
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Regardless of the type of claim or theory of liability (contractual, non-contractual, tort),
                    the total liability of Sitzy or its providers will not exceed 0 CZK.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    11. Account Deletion
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    You can delete your account at any time in Settings. Upon deletion, all your data will be cleared.
                    This action cannot be undone. Data about rides you are a participant of will remain available to other participants.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    12. Contact
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    If you have questions about these terms, contact us:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                      info@sitzy.page
                    </a>
                  </p>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
