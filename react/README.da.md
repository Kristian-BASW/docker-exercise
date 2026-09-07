# Docker-øvelse: Kør React-appen i en container

[English](README.md) | **Dansk**

I denne øvelse skal du skrive en `Dockerfile`, bygge et Docker-image og starte appen i en container. Du skal have Docker installeret og startet. Bun behøver ikke være installeret på din egen computer, da det følger med imaget.

En **Dockerfile** er opskriften på et **image**, som indeholder appen og dens køremiljø. En **container** er en kørende instans af imaget.

Appen i `react/` bruger Bun til at køre `src/index.ts`. Serveren leverer både React-siden og API-ruterne under `/api/hello`.

## 1. Gør projektet klar

Start Docker Desktop, hvis det er den Docker-installation, du bruger. Åbn derefter en terminal i mappen `docker-exercise/react`. I VS Code kan du højreklikke på `react`-mappen og vælge **Open in Integrated Terminal**.

Kør følgende for at kontrollere, at terminalen kan kontakte Docker:

```bash
docker info
```

Kommandoen skal vise oplysninger om både klienten og serveren. Hvis du får en fejl om forbindelsen til Docker, skal du starte Docker og prøve igen.

Find `package.json` i `react`-mappen. Under `scripts` kan du se, at appens `start`-kommando kører `bun src/index.ts` med `NODE_ENV=production`. Det fortæller os, hvilket køremiljø og hvilken startfil containeren skal bruge.

## 2. Opret en tom Dockerfile

Opret filen `react/Dockerfile` uden filendelse. Den skal ligge ved siden af `package.json` og `bun.lock`:

```text
docker-exercise/
└── react/
    ├── README.md
    ├── README.da.md
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    ├── bun.lock
    └── src/
```

I VS Code: Højreklik på `react`-mappen, vælg **New File**, og skriv `Dockerfile`. Filen skal hedde præcis dette, uden eksempelvis `.txt` bagefter.

## 3. Skriv Dockerfilen trin for trin

Tilføj kodeblokkene nedenfor i rækkefølge i den samme `Dockerfile`.

### Vælg et køremiljø

Start filen med:

```dockerfile
FROM oven/bun:1
```

Appen bruger Bun, så vi vælger et image, hvor Bun allerede er installeret. Du skal derfor ikke selv installere Bun i containeren.

### Vælg en mappe til appen

Tilføj:

```dockerfile
WORKDIR /app
```

`/app` er en mappe inde i imaget. Her placerer vi projektet, og herfra bliver startkommandoen kørt.

### Installer projektets pakker

Tilføj:

```dockerfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
```

`package.json` fortæller Bun, hvilke pakker projektet bruger, mens `bun.lock` fastholder de valgte versioner. Vi kopierer disse filer først, så installationen kan genbruges fra Dockers cache, når kun appens kode ændres.

### Kopier appens kode

Tilføj:

```dockerfile
COPY . .
```

Det første punktum er projektmappen, som du senere giver til `docker build`. Det andet er den aktuelle arbejdsmappe i imaget, altså `/app`. Dette tager blandt andet `src` og minion-billedet med. I næste trin opretter du en `.dockerignore`, der udelukker lokale filer.

### Indstil miljø og bruger

Tilføj:

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000

USER bun
```

Appens `src/index.ts` bruger `NODE_ENV` til at slå udviklingsfunktioner fra. `PORT` angiver serverens port. `USER bun` vælger en bruger fra base-imaget, så appen kører uden root-rettigheder.

### Angiv port og startkommando

Afslut filen med:

```dockerfile
EXPOSE 3000

CMD ["bun", "src/index.ts"]
```

`EXPOSE` dokumenterer porten, og `CMD` fortæller Docker, hvordan serveren skal startes. Gem filen.

### Opslag: Hvad betyder instruktionerne?

| Instruktion | Hvad gør den, og hvorfor er den med? |
| --- | --- |
| `FROM oven/bun:1` | Starter fra Buns officielle image med Bun 1 installeret. Tagget følger version 1; en bestemt version eller digest kan bruges, hvis base-imaget skal være låst. |
| `WORKDIR /app` | Opretter og vælger arbejdsfolderen i imaget. De næste kommandoer bruger denne mappe. |
| `COPY package.json bun.lock ./` | Kopierer pakkelisten og de låste afhængigheder ind først. |
| `RUN bun install --frozen-lockfile` | Installerer afhængigheder under image-buildet. Kommandoen fejler, hvis installationen kræver ændringer i lockfilen. |
| `COPY . .` | Kopierer appens øvrige filer fra build-konteksten til `/app`, bortset fra dem i `.dockerignore`. |
| `ENV NODE_ENV=production` | Får denne apps server til at slå udviklingsfunktioner som hot reload fra. |
| `ENV PORT=3000` | Angiver den port, Bun-serveren skal lytte på. |
| `USER bun` | Kører appen som image-brugeren `bun`, så processen ikke behøver root-rettigheder. |
| `EXPOSE 3000` | Dokumenterer containerens port. Porten skal stadig publiceres med `docker run -p`. |
| `CMD ["bun", "src/index.ts"]` | Starter serveren, når containeren starter. |

`RUN` udføres, når imaget bygges; `CMD` angiver standardkommandoen, når containeren startes. Se [Dockers Dockerfile-reference](https://docs.docker.com/reference/dockerfile/).

Afhængighederne kopieres og installeres før resten af koden, så Docker kan genbruge installationslaget, når du kun ændrer eksempelvis `App.tsx`. Eksemplet bruger Buns officielle image og installation med en låst lockfil som i [Buns Docker-guide](https://bun.com/guides/ecosystem/docker).

Vi installerer også udviklingsafhængighederne for at holde øvelsen enkel. `NODE_ENV` sættes først bagefter.

### Hvorfor er der ikke et `RUN bun run build`?

I dette projekt importerer `src/index.ts` filen `src/index.html` og serverer den gennem Bun. Derfor starter vi serveren direkte og tager kildekoden med i imaget. Projektets `build`-script bygger frontend-filer til `dist/`, men serveren er ikke sat op til at levere den mappe. Det ville kræve en anden opsætning.

## 4. Opret en .dockerignore

Højreklik igen på `react`-mappen, vælg **New File**, og navngiv filen `.dockerignore`, inklusive punktummet i starten. Indsæt følgende, og gem filen:

```dockerignore
node_modules
dist
.git
.DS_Store
*.log
.env
.env.*
```

`node_modules` skal installeres inde i imaget, så du får pakker til containerens miljø. `dist` bygges ikke ind i denne løsning. Resten udelukker Git-data, lokale filer og miljøfiler, der kan indeholde hemmeligheder.

Docker fjerner de matchende filer fra build-konteksten, før den sendes til builderen. Se [Docker-dokumentationen om .dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files).

## 5. Byg imaget

Brug terminalen fra trin 1, som står i `docker-exercise/react`, og kør:

```bash
docker build -t minion-app .
```

`-t minion-app` giver imaget et navn. Punktummet angiver den aktuelle mappe som **build-kontekst**: filerne, Docker må bruge i blandt andet `COPY`.

Vent, til buildet er færdigt uden fejl. Første gang skal Docker hente base-imaget og installere pakker. Kontroller derefter, at dit image findes:

```bash
docker image ls minion-app
```

Du skal se en række med navnet `minion-app`.

## 6. Start og test containeren

Kør fra samme terminal:

```bash
docker run --rm --name minion-app -p 127.0.0.1:3000:3000 minion-app
```

- `--rm` fjerner containeren, når den stopper. Imaget bliver liggende.
- `--name minion-app` giver containeren et navn.
- `-p 127.0.0.1:3000:3000` forbinder port 3000 på din computers localhost med port 3000 i containeren.
- Det sidste `minion-app` er navnet på imaget, der skal køres.

Bun lytter som standard på `0.0.0.0` inde i containeren, så Docker kan sende trafik til serveren. Se [Buns serverdokumentation](https://bun.com/docs/runtime/http/server).

Åbn http://localhost:3000 i browseren. Du skal kunne se React-siden med minion-billedet. Test også http://localhost:3000/api/hello, som skal returnere JSON med `"message": "Hello, world!"` og `"method": "GET"`.

Stop containeren med `Ctrl+C`, eller kør følgende i en anden terminal:

```bash
docker stop minion-app
```

## 7. Prøv at ændre appen

Ret teksten i `src/App.tsx`, og gem filen. Den kørende container bruger den kopi, der blev lagt i imaget under buildet.

1. Stop containeren med `Ctrl+C` i terminalen, hvor den kører.
2. Byg et nyt image og start en ny container med kommandoerne nedenfor.
3. Genindlæs siden i browseren, og kontroller, at din ændring vises.

```bash
docker build -t minion-app .
docker run --rm --name minion-app -p 127.0.0.1:3000:3000 minion-app
```
## 8. Kør en container mere med den samme image

Prøv at starte en anden container fra imaget `minion-app`, mens den første container stadig kører.

Overvej, hvordan du kan kontrollere, at den anden container kører, både i terminalen og i browseren.
