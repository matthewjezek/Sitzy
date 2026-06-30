# Use Case Diagram - Role a Interakce

```mermaid
graph TB
    subgraph Sitzy["Sitzy System"]
        UC1["Registrovat se"]
        UC2["Přihlásit se"]
        UC3["Vytvořit auto"]
        UC4["Pozvat pasažéra"]
        UC5["Přijmout pozvánku"]
        UC6["Obsadit sedadlo"]
        UC7["Plánovat jízdu"]
        UC8["Převést řízení<br/>na jiného uživatele"]
        UC10["Zobrazit přehled<br/>(Dashboard)"]
        UC11["Spravovat auta"]
        UC12["Zobrazit detail pozvánky"]
    end
    
    Driver["Řidič"]
    Passenger["Pasažér"]
    Guest["Host"]
    System["Auth System"]
    
    Driver --> UC3
    Driver --> UC4
    Driver --> UC7
    Driver --> UC8
    Driver --> UC10
    Driver --> UC11
    
    Passenger --> UC5
    Passenger --> UC6
    Passenger --> UC10
    
    Guest --> UC1
    Guest --> UC2
    Guest --> UC12
    
    System -->|validates| UC1
    System -->|verifies| UC2
    
    UC3 -->|umožňuje| UC4
    UC3 -->|umožňuje| UC7
    UC4 -->|vede k| UC5
    UC5 -->|vyžaduje| UC6
    UC8 -->|vyžaduje pozvánku| UC5
    UC12 -->|vyžaduje přihlášení| UC2
    
    style Sitzy fill:#e3f2fd
    style Driver fill:#c8e6c9
    style Passenger fill:#c8e6c9
    style Guest fill:#c8e6c9
    style System fill:#fff9c4
```

- **Poznámky:**
- Majitel auta vytváří jízdy (UC7), při kterých se automaticky stává řidičem
- UC8 (Transfer řízení) vyžaduje, aby nový řidič měl přijatou pozvánku
- UC10 (Dashboard) je hlavní přehledová stránka s rychlými akcemi a nejbližší jízdou
- Přijetí role řidiče (UC9) je součástí UC8 - není potřeba samostatný use case
- Host (Guest) může zobrazit detaily pozvánky (UC12), ale pro její přijetí (UC5) a obsazení sedadla (UC6) je vyžadováno přihlášení (UC2) nebo registrace (UC1)

