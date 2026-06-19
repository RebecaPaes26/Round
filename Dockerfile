FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@9.15.4 --activate
COPY package.json ./
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY . .
ENV NEXT_PUBLIC_API_URL=http://localhost:3333
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@9.15.4 --activate
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
