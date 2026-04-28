/**
 * Canonical category list for Explore NPM. Source of truth — the seed script
 * (scripts/seed-categories.ts) upserts this into the `categories` table by
 * slug, so adding/renaming entries here and re-running seed is safe.
 *
 * Slugs are stable URL identifiers. Names and descriptions are cosmetic.
 * `sort_order` in the DB is derived from array position, not stored here.
 */

export interface CategoryDef {
  slug: string;
  name: string;
  description: string;
}

export const CATEGORIES: CategoryDef[] = [
  // ── UI & rendering ──────────────────────────────────────────────────────
  { slug: "ui-components",     name: "UI Components",     description: "React, Vue, Svelte and other component libraries." },
  { slug: "headless-ui",       name: "Headless UI",       description: "Unstyled, accessible primitive component libraries." },
  { slug: "design-systems",    name: "Design Systems",    description: "Opinionated, tokenized component systems." },
  { slug: "css-tools",         name: "CSS Tools",         description: "Styling utilities, CSS-in-JS, Tailwind plugins." },
  { slug: "icons",             name: "Icons",             description: "Icon sets and icon component libraries." },
  { slug: "animation",         name: "Animation",         description: "Motion, transitions, tweening, spring physics." },
  { slug: "charts",            name: "Charts",            description: "Data visualization and charting libraries." },
  { slug: "3d-graphics",       name: "3D Graphics",       description: "three.js, WebGL, WebGPU, Babylon and 3D toolkits." },
  { slug: "canvas-2d",         name: "2D Canvas",         description: "2D drawing, canvas rendering, Pixi, Konva." },
  { slug: "typography",        name: "Typography",        description: "Fonts, text rendering, internationalized text." },
  { slug: "forms",             name: "Forms",             description: "Form state, validation UX, input primitives." },

  // ── App & framework ────────────────────────────────────────────────────
  { slug: "meta-frameworks",   name: "Meta-frameworks",   description: "Next.js, Nuxt, SvelteKit, Remix, Astro." },
  { slug: "build-tools",       name: "Build Tools",       description: "Vite, Webpack, Rollup, esbuild, tsup, Turbopack." },
  { slug: "bundler-plugins",   name: "Bundler Plugins",   description: "Plugins extending bundlers above." },
  { slug: "dev-servers",       name: "Dev Servers",       description: "Local dev servers and hot-reload tooling." },
  { slug: "monorepo",          name: "Monorepo",          description: "Turbo, Nx, Lerna, pnpm workspace tooling." },
  { slug: "routing",           name: "Routing",           description: "Client-side routers." },
  { slug: "state-management",  name: "State Management",  description: "Redux, Zustand, Jotai, Signals, similar." },
  { slug: "data-fetching",     name: "Data Fetching",     description: "SWR, React Query, urql, Apollo, similar." },

  // ── Runtime & platform ─────────────────────────────────────────────────
  { slug: "electron",          name: "Electron",          description: "Desktop app frameworks and tooling." },
  { slug: "expo-react-native", name: "Expo & React Native", description: "Mobile frameworks and React Native libraries." },
  { slug: "cli-frameworks",    name: "CLI Frameworks",    description: "Building CLIs (commander, oclif, ink)." },
  { slug: "cli-tools",         name: "CLI Tools",         description: "End-user developer CLIs published as packages." },
  { slug: "nodejs-runtime",    name: "Node.js Runtime",   description: "Node-specific utilities, workers, cluster helpers." },
  { slug: "edge-runtime",      name: "Edge Runtime",      description: "Cloudflare Workers, Deno, Bun-specific libraries." },
  { slug: "browser-extensions",name: "Browser Extensions",description: "Frameworks and helpers for browser extensions." },
  { slug: "wasm",              name: "WebAssembly",       description: "WASM toolchains, bindings, runtimes." },
  { slug: "web-workers",       name: "Web Workers",       description: "Worker helpers, Comlink-style libraries." },

  // ── Data & persistence ─────────────────────────────────────────────────
  { slug: "orm",               name: "ORM",               description: "Prisma, Drizzle, Kysely, TypeORM." },
  { slug: "query-builders",    name: "Query Builders",    description: "SQL builders without a full ORM." },
  { slug: "db-clients",        name: "Database Clients",  description: "Postgres, MySQL, SQLite drivers." },
  { slug: "vector-db",         name: "Vector Databases",  description: "Pinecone, Weaviate, pgvector clients." },
  { slug: "caching",           name: "Caching",           description: "LRU, Redis clients, in-memory caches." },
  { slug: "schema-validation", name: "Schema Validation", description: "Zod, Valibot, ArkType, Yup." },
  { slug: "serialization",     name: "Serialization",     description: "JSON tools, msgpack, protobuf." },

  // ── Auth & security ────────────────────────────────────────────────────
  { slug: "auth",              name: "Auth",              description: "Auth frameworks, sessions, OAuth clients." },
  { slug: "crypto",            name: "Crypto",            description: "Hashing, signing, encryption libraries." },
  { slug: "security-scanning", name: "Security Scanning", description: "Audit, SAST, secret-scanning tools." },

  // ── AI & ML ────────────────────────────────────────────────────────────
  { slug: "llm-clients",       name: "LLM Clients",       description: "OpenAI, Anthropic, Google SDKs and openrouter clients." },
  { slug: "llm-frameworks",    name: "LLM Frameworks",    description: "LangChain, LlamaIndex, AI SDK, Instructor." },
  { slug: "embeddings",        name: "Embeddings",        description: "Embedding generation and reranking." },
  { slug: "agents-tools",      name: "Agents & Tools",    description: "Agent frameworks, tool-use helpers." },
  { slug: "ml-runtime",        name: "ML Runtime",        description: "TensorFlow.js, ONNX runtime, Transformers.js." },

  // ── Developer experience ───────────────────────────────────────────────
  { slug: "testing",           name: "Testing",           description: "Unit, integration, and e2e frameworks." },
  { slug: "mocking",           name: "Mocking",           description: "Mocks, fixtures, MSW." },
  { slug: "linting",           name: "Linting",           description: "ESLint, Biome, Oxlint and plugins." },
  { slug: "formatting",        name: "Formatting",        description: "Prettier, dprint." },
  { slug: "type-tools",        name: "Type Tools",        description: "TypeScript utilities, type-level magic, JSON-Schema bridges." },
  { slug: "debugging",         name: "Debugging",         description: "Loggers, error tracking, tracing clients." },
  { slug: "benchmarking",      name: "Benchmarking",      description: "Performance measurement and profiling." },

  // ── Protocols & I/O ────────────────────────────────────────────────────
  { slug: "http-clients",      name: "HTTP Clients",      description: "fetch wrappers and axios-style libraries." },
  { slug: "http-servers",      name: "HTTP Servers",      description: "Express, Hono, Fastify, Elysia." },
  { slug: "websockets",        name: "WebSockets",        description: "Realtime libraries and pub/sub." },
  { slug: "rpc",               name: "RPC",               description: "tRPC, gRPC, JSON-RPC." },
  { slug: "graphql",           name: "GraphQL",           description: "GraphQL clients and servers." },
  { slug: "mcp",               name: "MCP",               description: "Model Context Protocol servers and clients." },
  { slug: "streaming",         name: "Streaming",         description: "Streams, server-sent events, media streaming." },

  // ── Content & media ────────────────────────────────────────────────────
  { slug: "markdown",          name: "Markdown",          description: "Parsers, renderers, MDX tooling." },
  { slug: "editors",           name: "Editors",           description: "Rich-text and code-editor frameworks (Monaco, CodeMirror, TipTap)." },
  { slug: "images",            name: "Images",            description: "Image processing, manipulation, format conversion." },
  { slug: "video-audio",       name: "Video & Audio",     description: "Media processing, playback, recording." },
  { slug: "pdf",               name: "PDF",               description: "PDF generation and parsing." },

  // ── Utilities ──────────────────────────────────────────────────────────
  { slug: "date-time",         name: "Date & Time",       description: "Date libraries and timezone handling." },
  { slug: "i18n",              name: "Internationalization", description: "i18n and translation libraries." },
  { slug: "utility-libraries", name: "Utility Libraries", description: "Lodash-family and functional helpers." },
  { slug: "data-structures",   name: "Data Structures",   description: "Immutable, trees, graphs, CRDTs." },
  { slug: "id-generation",     name: "ID Generation",     description: "uuid, nanoid, cuid, ulid." },
  { slug: "math",              name: "Math",              description: "Big numbers, matrix math, geometry." },

  // ── Experimental / bleeding-edge ───────────────────────────────────────
  { slug: "web-spec-experiments", name: "Web Spec Experiments", description: "Packages exploring new HTML/CSS/JS specs (View Transitions, Popover API, Anchor Positioning)." },
  { slug: "browser-apis",         name: "New Browser APIs",     description: "Wrappers for new browser APIs (WebGPU, File System Access, WebHID, WebUSB)." },
  { slug: "research-projects",    name: "Research Projects",    description: "Academic and research-adjacent prototypes." },
];
