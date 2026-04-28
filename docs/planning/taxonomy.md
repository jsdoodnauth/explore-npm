# Starter Taxonomy

Fixed category list seeded into the `categories` table. Each package gets 1–3 categories via the LLM classifier. Slugs are stable; names/descriptions can be edited without breaking URLs.

**Design principles:**
- ~60 categories — coarse enough to browse, fine enough to matter
- Organized into rough groups for UI affordances (nav, filters) but groups aren't their own table rows in v1 — we use a `parent_id` only if we need nesting later
- Covers the breadth the user called out: "bleeding-edge," 3D, Electron/Expo, HTML spec experiments, general utilities
- Deliberately avoids topic-only categories like "machine learning" when the ecosystem reality is "LLM clients," "embeddings," "vector-db clients," etc. — specificity drives discovery

## Categories

### UI & rendering
- `ui-components` — React/Vue/Svelte/etc. component libraries
- `headless-ui` — unstyled / primitive component libraries (Radix-style)
- `design-systems` — opinionated, tokenized component systems
- `css-tools` — styling utilities, CSS-in-JS, tailwind plugins
- `icons` — icon sets and icon components
- `animation` — motion, transitions, tweening, spring physics
- `charts` — data viz, charting libraries
- `3d-graphics` — three.js, WebGL, WebGPU, babylon
- `canvas-2d` — 2D drawing, canvas, pixi, konva
- `typography` — fonts, text rendering, i18n text
- `forms` — form state, validation UX

### App & framework
- `meta-frameworks` — Next, Nuxt, SvelteKit, Remix, Astro
- `build-tools` — Vite, Webpack, Rollup, esbuild, tsup, turbopack
- `bundler-plugins` — plugins for the above
- `dev-servers` — local dev servers, hot-reload tooling
- `monorepo` — turbo, nx, lerna, pnpm workspaces tooling
- `routing` — client routers
- `state-management` — Redux, Zustand, Jotai, Signals, etc.
- `data-fetching` — SWR, React Query, urql, Apollo

### Runtime & platform
- `electron` — desktop app frameworks and tooling
- `expo-react-native` — mobile frameworks + React Native libs
- `cli-frameworks` — building CLIs (commander, oclif, ink)
- `cli-tools` — end-user developer CLIs published as packages
- `nodejs-runtime` — Node-specific utilities, workers, cluster
- `edge-runtime` — Cloudflare Workers, Deno, Bun-specific
- `browser-extensions` — extension frameworks and helpers
- `wasm` — WebAssembly toolchains, bindings, runtimes
- `web-workers` — worker helpers, comlink-style

### Data & persistence
- `orm` — Prisma, Drizzle, Kysely, TypeORM
- `query-builders` — SQL builders without full ORM
- `db-clients` — Postgres/MySQL/SQLite/etc. drivers
- `vector-db` — pinecone, weaviate, pgvector clients
- `caching` — LRU, Redis clients, in-memory caches
- `schema-validation` — Zod, Valibot, ArkType, Yup
- `serialization` — JSON tools, msgpack, protobuf

### Auth & security
- `auth` — auth frameworks, session, OAuth clients
- `crypto` — hashing, signing, encryption
- `security-scanning` — audit, SAST, secret scanning

### AI & ML
- `llm-clients` — OpenAI/Anthropic/Google SDKs, openrouter, etc.
- `llm-frameworks` — langchain, llamaindex, ai SDK, instructor
- `embeddings` — embedding generation, reranking
- `agents-tools` — agent frameworks, tool-use helpers
- `ml-runtime` — tensorflow.js, onnxruntime, transformers.js

### Developer experience
- `testing` — unit, integration, e2e frameworks
- `mocking` — mocks, fixtures, MSW
- `linting` — ESLint, Biome, Oxlint and plugins
- `formatting` — Prettier, dprint
- `type-tools` — TS utilities, type-level magic, JSON schema ↔ TS
- `debugging` — loggers, error tracking clients, tracing
- `benchmarking` — perf measurement, profiling

### Protocols & I/O
- `http-clients` — fetch wrappers, axios-likes
- `http-servers` — Express, Hono, Fastify, Elysia
- `websockets` — realtime libs, pub/sub
- `rpc` — tRPC, grpc, JSON-RPC
- `graphql` — GraphQL clients and servers
- `mcp` — Model Context Protocol servers/clients
- `streaming` — streams, SSE, media streaming

### Content & media
- `markdown` — parsers, renderers, MDX tooling
- `editors` — rich text / code editor frameworks (Monaco, CodeMirror, TipTap)
- `images` — image processing, manipulation, format conversion
- `video-audio` — media processing, playback, recording
- `pdf` — PDF generation and parsing

### Utilities
- `date-time` — date libraries, timezones
- `i18n` — internationalization, translation
- `utility-libraries` — lodash-family, functional helpers
- `data-structures` — immutable, trees, graphs, CRDTs
- `id-generation` — uuid, nanoid, cuid, ulid
- `math` — big numbers, matrix math, geometry

### Experimental / bleeding-edge
- `web-spec-experiments` — packages demoing new HTML/CSS/JS specs (View Transitions, Popover API, Anchor Positioning, etc.)
- `browser-apis` — wrappers for new browser APIs (WebGPU, File System Access, WebHID, WebUSB)
- `research-projects` — academic / research-adjacent prototypes

## Seeding

- Taxonomy lives in `src/lib/taxonomy.ts` as the source of truth
- Seed script `scripts/seed-categories.ts` upserts into `categories` by `slug`
- Editing a name or description in code + re-running seed is safe
- Adding a new category is safe — existing packages get re-categorized only if we flip a re-categorize flag

## Future work (not MVP)

- Subcategories (e.g., `3d-graphics` → `webgpu`, `webgl`, `scene-graph`) via `parent_id`
- User-suggested categories with moderation
- "Auto-split" signal: if a category exceeds 500 packages, LLM proposes a split
