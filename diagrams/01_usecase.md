# Use Case Diagram - Role a Interakce

```mermaid
graph TB
    subgraph Sitzy["🚗 Sitzy System"]
        UC1["Registrovat se"]
        UC2["Přihlásit se"]
        UC3["Vytvořit auto"]
        UC4["Pozvat pasažéra"]
        UC5["Přijmout pozvánku"]
        UC6["Obsadit sedadlo"]
        UC7["Plánovat jízdu"]
        UC8["Převést řízení<br/>na jiného uživatele"]
        UC10["Zobrazit palubní desku<br/>(budoucí feature)"]
        UC11["Spravovat auta"]
    end
    
    Driver["👨‍✈️ Řidič"]
    Passenger["👤 Pasažér"]
    System["🔐 Auth System"]
    
    Driver --> UC1
    Driver --> UC2
    Driver --> UC3
    Driver --> UC4
    Driver --> UC7
    Driver --> UC8
    Driver --> UC10
    Driver --> UC11
    
    Passenger --> UC1
    Passenger --> UC2
    Passenger --> UC5
    Passenger --> UC6
    Passenger --> UC10
    
    System -->|validates| UC1
    System -->|verifies| UC2
    
    UC3 -->|umožňuje| UC4
    UC3 -->|umožňuje| UC7
    UC4 -->|vede k| UC5
    UC5 -->|vyžaduje| UC6
    UC8 -->|vyžaduje pozvánku| UC5
    
    style Sitzy fill:#e3f2fd
    style Driver fill:#c8e6c9
    style Passenger fill:#c8e6c9
    style System fill:#fff9c4
    style UC10 fill:#ffe0b2
```

**Poznámky:**

- Majitel auta vytváří jízdy (UC7), při kterých se automaticky stává řidičem
- UC8 (Transfer řízení) vyžaduje, aby nový řidič měl přijatou pozvánku
- UC10 (Dashboard) je označen jako budoucí feature
- Přijetí role řidiče (UC9) je součástí UC8 - není potřeba samostatný use case
