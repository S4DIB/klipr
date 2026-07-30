# syntax=docker/dockerfile:1
# Klipr production image. Plain Node + Next (`next build` → `next start`),
# no Nixpacks. In Coolify set the app's Build Pack to "Dockerfile".

FROM node:22-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 PORT=3000

# Install ALL deps (devDeps are needed to build). We use `npm install`, not
# `npm ci`: the committed lockfile drifts across platforms for native/optional
# deps (@tailwindcss/oxide, @emnapi, …), which makes strict `npm ci` fail on the
# Linux build host. `npm install` reconciles it for this platform.
COPY package.json package-lock.json ./
RUN npm install --include=dev --no-audit --no-fund

# App source.
COPY . .

# Public Supabase config is INLINED into the build, so it must be present at
# build time. Coolify supplies these as --build-arg from the app's env vars.
# Server-only secrets (SUPABASE_SERVICE_ROLE_KEY, TOKEN_KEY, CRON_SECRET,
# ADMIN_EMAILS, …) are injected at RUNTIME by Coolify — never baked here.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
