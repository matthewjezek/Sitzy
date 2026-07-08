# ER Diagram – Uživatelské účty a OAuth relace

Tento diagram zobrazuje výsek databázového schématu zaměřený na tabulku USERS a její vazby na identity (SOCIAL_ACCOUNTS) a sezení (SOCIAL_SESSIONS).

```mermaid
%%{init: {"theme": "neutral", "themeVariables": {"fontFamily": "sans-serif"}}}%%
erDiagram
    USERS {
        UUID id PK
        string email
        string full_name
        string avatar_url
        datetime created_at
        datetime updated_at
    }
    
    SOCIAL_ACCOUNTS {
        UUID id PK
        UUID user_id FK
        string provider
        string social_id
        string email
        datetime linked_at
    }

    SOCIAL_SESSIONS {
        UUID id PK
        UUID user_id FK
        UUID social_account_id FK
        string access_token
        string refresh_token
        datetime expires_at
        datetime created_at
        datetime revoked_at
        string user_agent
    }

    USERS ||--o{ SOCIAL_ACCOUNTS : "má propojené identity"
    USERS ||--o{ SOCIAL_SESSIONS : "má aktivní sezení"
    SOCIAL_ACCOUNTS ||--o{ SOCIAL_SESSIONS : "autentizuje sezení"
```
