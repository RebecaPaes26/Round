# Round

Front-end Next.js + TypeScript do Round Multidisciplinar.

A API agora fica em um repositorio separado:

```powershell
C:\Users\hmrg\Documents\GitHub\Round-Api
```

## Instalar as ferramentas

Se sua maquina ainda nao tiver `node`, `pnpm`, `docker` ou `git` no PATH, instale pelo PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
winget install Git.Git --accept-source-agreements --accept-package-agreements
winget install Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
```

Feche e abra o PowerShell de novo. Depois rode:

```powershell
node -v
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm -v
docker --version
```

## Rodar localmente

Suba primeiro a API no repositorio `Round-Api`. Depois rode o front:

```powershell
cd C:\Users\hmrg\Documents\GitHub\Round
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

Acesse:

- Web: http://localhost:3000
- API esperada: http://localhost:3333/api

## Rodar o front em Docker

```powershell
cd C:\Users\hmrg\Documents\GitHub\Round
docker compose up --build
```

## Configuracao

O front le a URL da API por:

```text
NEXT_PUBLIC_API_URL=http://localhost:3333
```
