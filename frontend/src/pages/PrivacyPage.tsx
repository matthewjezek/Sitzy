import { useEffect, useState } from 'react';
import DocHeader from '../components/DocHeader';
import { getInitialLanguage, setStoredLanguage, type Language } from '../utils/language';

export default function PrivacyPage() {
  const [lang, setLang] = useState<Language>(() => getInitialLanguage());

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  useEffect(() => {
    document.title = lang === 'cs' ? 'Zásady ochrany osobních údajů - Sitzy' : 'Privacy Policy - Sitzy';
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
                Zásady ochrany osobních údajů
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
                  Aplikace neposkytuje reálné přepravní služby. Veškeré údaje jsou shromažďovány 
                  pouze za účelem demonstrace technického řešení a budou po obhajobě trvale smazány.
                </p>
              </div>

              <div className="prose dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    1. Úvod
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy je webová aplikace pro koordinaci sdílených jízd. S vašimi osobními údaji nakládáme odpovědně.
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
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>unikátní identifikátor (ID) od poskytovatele přihlášení,</li>
                        <li>jméno a profilový obrázek,</li>
                        <li>e-mailovou adresu (pokud je poskytnuta),</li>
                        <li>pokud e-mail není k dispozici (typicky u sítě X), účet je veden pod identitou poskytovatele (provider ID),</li>
                        <li>přístupový token pro relaci (session token).</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.2 Údaje o jízdách a automobilech</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Při aktivním používání aplikace ukládáme:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>záznamy o vozidlech, která v aplikaci vytvoříte,</li>
                        <li>záznamy o jízdách a jejich účastnících,</li>
                        <li>odeslané pozvánky a statusy o jejich přijetí,</li>
                        <li>přiřazená místa (sedačky) a jejich pozice ve vozidle.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.3 Technické údaje</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Z bezpečnostních a provozních důvodů zaznamenáváme:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>časy přihlášení a odhlášení uživatele,</li>
                        <li>údaje o relacích (přístupové tokeny),</li>
                        <li>auditní události integrace OAuth (stavy přihlášení, výměna, obnovení a zneplatnění tokenů),</li>
                        <li>chybové zprávy a systémové logy (neobsahující osobní údaje).</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    3. Jak používáme vaše údaje?
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Údaje využíváme výhradně k následujícím účelům:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-2">
                    <li>zajištění funkčnosti aplikace (správa jízd, spolucestujících),</li>
                    <li>ověření totožnosti (autentizace) a zabezpečení vašeho účtu,</li>
                    <li>vylepšování aplikace a odstraňování technických chyb,</li>
                    <li>komunikace s vámi (bude-li to nezbytně nutné pro provoz aplikace).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    4. Jak dlouho údaje uchováváme?
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vaše údaje uchováváme po dobu, kdy je váš účet aktivní. V případě smazání účtu:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>jsou okamžitě vymazány veškeré vaše osobní údaje,</li>
                    <li>jsou trvale odstraněna data o vašich vozidlech a jízdách, kde jste zakladatelem,</li>
                    <li>jsou odstraněny všechny nevyužité pozvánky,</li>
                    <li>systémové logy a auditní záznamy jsou automaticky vymazány po 30 dnech.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    5. Sdílení údajů
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vaše údaje nesdílíme s žádnými třetími stranami. V rámci aplikace jsou podrobnosti o konkrétní jízdě viditelné pouze pro:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>vlastníka vozidla (zakladatele jízdy),</li>
                    <li>přiřazeného řidiče jízdy,</li>
                    <li>ostatní účastníky téže jízdy.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    6. Vaše práva
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Podle platných předpisů o ochraně osobních údajů máte právo na:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li><strong>Přístup</strong> — možnost prohlížet si data, která o vás uchováváme,</li>
                    <li><strong>Opravu</strong> — možnost opravit nepřesné či neúplné údaje,</li>
                    <li><strong>Výmaz (zapomenutí)</strong> — možnost smazat svůj účet a veškerá data (tato volba je trvale dostupná v sekci Nastavení),</li>
                    <li><strong>Přenositelnost</strong> — možnost vyexportovat své údaje v přenositelné formě.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    7. Bezpečnost
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vaše údaje jsou chráněny následujícími způsoby:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>šifrovaným přenosem dat (HTTPS) mezi vaším zařízením a servery,</li>
                    <li>bezpečnými tokeny relací (JWT) a kryptograficky podepsaným ověřením,</li>
                    <li>zabezpečenou databází s přísně omezeným přístupem.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    8. Cookies a lokální úložiště (LocalStorage)
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Využíváme pouze nezbytně nutné technické soubory cookie a lokální úložiště prohlížeče pro zajištění chodu a přizpůsobení aplikace. Nepoužíváme žádné analytické ani reklamní sledovací (tracking) nástroje třetích stran.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">8.1 Soubory Cookies</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li><strong>refresh_token</strong> (HttpOnly, Secure, SameSite=Lax) — Klientský token pro bezpečné automatické obnovování přihlášení (platnost 7 dní).</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">8.2 Lokální úložiště (LocalStorage)</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li><strong>access_token</strong> — Krátkodobý JWT token pro autorizaci požadavků k API (platnost 15 minut).</li>
                        <li><strong>sitzy_lang</strong> — Uložená předvolba jazyka (CZ nebo EN).</li>
                        <li><strong>theme</strong> — Uložená předvolba vzhledu rozhraní (light, dark nebo systémový motiv).</li>
                        <li><strong>sitzy_anonymize_exports</strong> — Nastavení ochrany soukromí při exportu tras a jízd (anonymizace údajů).</li>
                        <li><strong>sitzy_show_demo_ui</strong> — Předvolba zobrazení vývojářských/testovacích prvků (aktivní pouze ve vývojovém prostředí).</li>
                        <li><strong>post_login_redirect</strong> — Dočasně uložená cesta pro přesměrování po přihlášení (např. při vstupu z pozvánky).</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    9. Kontakt
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Máte-li jakékoli dotazy ohledně ochrany vašich osobních údajů, kontaktujte nás:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                      info@sitzy.page
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    10. Změny těchto zásad
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Tyto zásady můžeme v budoucnu upravovat. Aktuální verzi naleznete vždy na této stránce.
                  </p>
                </section>
              </div>
            </>
          ) : (
            // ── ENGLISH VERSION ──
            <>
              <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                Privacy Policy
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
                    1. Introduction
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sitzy is a web application for coordinating shared rides. We handle your personal data responsibly.
                    This policy explains what data we collect, why we collect it, and what your rights are.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    2. What Data Do We Collect?
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.1 Data from OAuth Login</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        When you log in via Facebook or X (Twitter), we collect:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>a unique ID from the login provider,</li>
                        <li>name and profile picture,</li>
                        <li>email address (if provided),</li>
                        <li>if the email is not available (typically X), the account is associated with the provider ID identity,</li>
                        <li>access token for the session.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.2 Ride and Car Data</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        When you actively use the application, we store:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>records of cars you create,</li>
                        <li>records of rides and their participants,</li>
                        <li>sent invitations and their acceptance statuses,</li>
                        <li>assigned seats and their position layout inside the vehicle.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">2.3 Technical Data</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        For security and operational purposes, we log:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li>login and logout timestamps,</li>
                        <li>session data (access tokens),</li>
                        <li>audit events of OAuth integration (login states, token exchange, refresh, and revocation),</li>
                        <li>error messages and system logs (excluding personal data).</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    3. How We Use Your Data
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We use the collected data exclusively for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-2">
                    <li>ensuring application functionality (management of rides, passengers),</li>
                    <li>authentication and security of your account,</li>
                    <li>improving the application and resolving technical issues,</li>
                    <li>communicating with you (only if absolutely necessary for the operation of the application).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    4. How Long Is Data Retained?
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We retain your data as long as your account is active. When you delete your account:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>all of your personal data is immediately erased,</li>
                    <li>records of your cars and rides you created are permanently deleted,</li>
                    <li>all unused invitations are removed,</li>
                    <li>system logs and audit trails are automatically cleared after 30 days.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    5. Sharing of Data
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We do not share your data with any third parties. Within the application, details of a specific ride are only visible to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>the car owner (ride creator),</li>
                    <li>the assigned driver of the ride,</li>
                    <li>other participants of the same ride.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    6. Your Rights
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    According to applicable data protection regulations, you have the right to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li><strong>Access</strong> — view the personal data we store about you,</li>
                    <li><strong>Rectification</strong> — request correction of inaccurate or incomplete information,</li>
                    <li><strong>Erasure (Right to be forgotten)</strong> — delete your account and all associated data (this option is permanently available in Settings),</li>
                    <li><strong>Portability</strong> — export your data in a portable format.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    7. Security
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Your data is secured using the following methods:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <li>encrypted data transfer (HTTPS) between your device and our servers,</li>
                    <li>secure session tokens (JWT) and cryptographically signed validation,</li>
                    <li>secured database storage with strictly restricted access.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    8. Cookies and Local Storage (LocalStorage)
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We use only strictly necessary technical cookies and browser local storage to ensure the core operation and customization of the application. We do not use any analytical or advertising tracking tools from third parties.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">8.1 Cookies</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li><strong>refresh_token</strong> (HttpOnly, Secure, SameSite=Lax) — Client token for secure automatic login renewals (valid for 7 days).</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">8.2 Local Storage (LocalStorage)</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 ml-2 space-y-1">
                        <li><strong>access_token</strong> — Short-lived JWT token for authorizing API requests (valid for 15 minutes).</li>
                        <li><strong>sitzy_lang</strong> — Stored language preference (CZ or EN).</li>
                        <li><strong>theme</strong> — Stored user theme preference (light, dark, or system).</li>
                        <li><strong>sitzy_anonymize_exports</strong> — Privacy settings preference to anonymize exported routes and rides.</li>
                        <li><strong>sitzy_show_demo_ui</strong> — Preference showing developer/test tools (development mode only).</li>
                        <li><strong>post_login_redirect</strong> — Temporary URL path redirecting users after login (e.g. when accessing via invitation links).</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    9. Contact
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    If you have questions regarding the protection of your personal data, contact us:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    Email: <a href="mailto:info@sitzy.page" className="text-blue-600 dark:text-blue-400 hover:underline">
                      info@sitzy.page
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    10. Changes to This Policy
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    We may change this policy. You can always read the current version on this page.
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
