# UStart

UStart Student Portal — Next.js 14, TypeScript, Tailwind CSS.

---

## Local Setup

**Prerequisites:** Node.js 18+

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase, Stripe, Resend, and PostHog credentials in `.env.local`.
   For local verification only, mock values work — the app will start but service calls will fail.

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Testing

Run all tests:
```bash
npm run test
```

Other checks:
```bash
npm run typecheck   # TypeScript type check
npm run lint        # ESLint
npm run build       # Production build
```

---

## Environment Variables

See `.env.example` for the full list of required variables.
Never commit `.env.local` — it is gitignored.
