# Qapital Atlas

React + TypeScript + Vite prototype for a calm “money direction” experience.

**Documentation (product context, HTTP APIs, onboarding flow, local setup):** [ATLAS.md](./ATLAS.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run server` | Optional billing API (`server/index.mjs`; use with Adyen env vars) |
| `npm run lint` | ESLint |

Copy `.env.example` to `.env` when using the billing server or `VITE_USE_BILLING_API`.
