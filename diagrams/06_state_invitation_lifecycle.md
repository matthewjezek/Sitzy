# State Diagram - Lifecycle Pozvánky a Účasti na Jízdě

```mermaid
stateDiagram-v2
    [*] --> Pending: vytvoření pozvánky

    Pending --> Accepted: POST /invitations/{token}/accept
    Pending --> Rejected: POST /invitations/{token}/reject
    Pending --> Deleted: DELETE /invitations/{token}
    Pending --> Expired: expires_at < now()

    Accepted --> [*]
    Rejected --> [*]
    Deleted --> [*]
    Expired --> [*]

    state Accepted {
        [*] --> PassengerCreated
        PassengerCreated --> SeatAssigned
    }

    note right of Pending
        Pozvánka je vázaná na ride_id,<br/>
        ne na car_id.<br/>
        Přijetí vytvoří Passenger záznam.
    end note

    note right of Deleted
        DELETE odstraní invitation row.<br/>
        Na rozdíl od ACCEPT/REJECT se stav neukládá do DB.
    end note
```

## Co diagram pokrývá

- Přechody pozvánky mezi `PENDING`, `ACCEPTED`, `REJECTED` a expirací
- Mazání pozvánky vlastníkem auta
- Vazbu mezi přijetím pozvánky a vytvořením `Passenger`
