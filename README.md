This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Fonts load through [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) (Stack Sans, the Klipr brand typeface).

## Deploy

Klipr runs on **Coolify** (self-hosted VPS), built from the `Dockerfile` in this repo. Env vars, the Supabase migrations and the scheduled sweep task are covered step by step in [PRODUCTION.md](PRODUCTION.md).
