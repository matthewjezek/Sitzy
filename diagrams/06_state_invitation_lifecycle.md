# State Diagram – Životní cyklus pozvánky

Tento stavový diagram znázorňuje stavy, kterými prochází pozvánka od svého vytvoření až po ukončení platnosti nebo přijetí. Stavy odpovídají hodnotám enumerátoru `InvitationStatus` v databázi.

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif"}}}%%
stateDiagram-v2
    state "Čekající" as Cekajici
    state "Přijatá" as Prijata
    state "Zamítnutá" as Zamitnuta
    state "Expirovaná" as Expirovana

    [*] --> Cekajici : vytvoření pozvánky (Pending)

    Cekajici --> Prijata : přijetí a výběr sedadla (Accepted)
    Cekajici --> Zamitnuta : odmítnutí pozvánky (Rejected)
    Cekajici --> Expirovana : vypršení platnosti (Expired)
    Cekajici --> [*] : smazání pořadatelem (DELETE)

    state Prijata {
        state "Vytvořen pasažér" as VytvorenPasazer
        state "Přiřazeno sedadlo" as PrirazenoSedadlo
        
        [*] --> VytvorenPasazer : zápis do databáze
        VytvorenPasazer --> PrirazenoSedadlo : obsazení místa v autě
    }

    Prijata --> [*]
    Zamitnuta --> [*]
    Expirovana --> [*]
```
