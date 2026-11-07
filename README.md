# Inventory Dashboard (Express.js + Supabase)

Dashboard with full CRUD: stat cards, category summary, search, add/edit modal, delete.
Backend: Express.js. Database: Supabase (PostgreSQL) via `pg`.

## 1. Create the Supabase database
1. Go to https://supabase.com and create a free project (save the database password).
2. Open **Project Settings > Database > Connection string > URI** and copy it
   (the pooler URI on port 6543 works well).
3. (Optional) Run `schema.sql` in the **SQL Editor**. The server also creates the table on startup.

## 2. Run the app
```bash
npm install
cp .env.example .env     # paste your Supabase URI, replacing [YOUR-PASSWORD]
npm start
```
Open http://localhost:3000

## REST API
| Method | Endpoint          | Purpose              |
|--------|-------------------|----------------------|
| GET    | /api/items?q=     | List / search items  |
| GET    | /api/items/:id    | Get one item         |
| POST   | /api/items        | Create               |
| PUT    | /api/items/:id    | Update               |
| DELETE | /api/items/:id    | Delete               |
| GET    | /api/stats        | Dashboard statistics |

Item body: `{ "name": "Mouse", "category": "Electronics", "price": 499.5, "quantity": 10 }`

## Notes
- Keep `.env` private; never commit it.
- Special characters in your DB password must be URL-encoded in the URI (e.g. `@` → `%40`).
