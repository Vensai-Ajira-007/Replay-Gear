# ReplayGear — Pre-Owned Games & Consoles

A full-stack demo storefront for buying used games and consoles.

- **Front-end/** — Vite + React + TypeScript + Tailwind CSS storefront (hero, filters, product grid, cart badge).
- **Back-end/** — Node.js + Express + TypeScript REST API (in-memory catalog + cart).

## Quick start

From the repo root, install everything and run both servers with one command:

```bash
npm run install:all   # installs Back-end + Front-end deps
npm run dev           # runs the API (:4000) and the web app (:5173) together
```

Then open the Vite URL it prints (http://localhost:5173). The frontend proxies
`/api/*` to the backend, so no CORS or env setup is needed in development.

Run them separately if you prefer:

```bash
npm run dev:api   # backend only  -> http://localhost:4000
npm run dev:web   # frontend only -> http://localhost:5173
```

## API

Base URL: `http://localhost:4000/api`

| Method | Path                     | Description                                            |
| ------ | ------------------------ | ------------------------------------------------------ |
| GET    | `/health`                | Health check                                           |
| GET    | `/products`              | List catalog. Query: `search`, `type` (`all`/`game`/`console`), `platform`, `sort` (`featured`/`price-asc`/`price-desc`) |
| GET    | `/products/:id`          | Single product                                         |
| GET    | `/cart`                  | Current cart (lines, `totalItems`, `subtotal`)         |
| POST   | `/cart`                  | Add item — body `{ "productId": number, "qty"?: number }` |
| DELETE | `/cart/:productId`       | Remove a line                                          |
| DELETE | `/cart`                  | Clear the cart                                         |

## Notes

- Data is **in-memory** and seeded on startup, so the catalog and cart reset when
  the API restarts. Swapping to a real database later only touches
  `Back-end/src/data/` and `Back-end/src/store/`.
- The cart is a single global cart (no auth/sessions) — fine for a demo, easy to
  key by user/session later.

## Build

```bash
npm run build   # builds both Back-end (tsc) and Front-end (tsc + vite)
```
