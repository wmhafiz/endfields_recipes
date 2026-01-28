## Context

The app currently treats `src/data/db.json` (already enriched into `{ items: [], recipes: [] }`) as the canonical runtime source for:

- Items (identified by `itemId`, routed by `slug`, optionally `localImagePath`)
- Recipes (identified by `id`, with `ingredients[]` / `outputs[]`, plus `machineId` / `machineName`, and optional `machineImagePath`)

Payload CMS is already configured to use PostgreSQL (`@payloadcms/db-postgres`) and includes a basic `media` upload collection. We want to migrate the dataset into Payload (Postgres) to make it queryable, scalable, and ready for future admin-managed updates, while keeping the public site behavior consistent.

Key constraints:

- Postgres connection is provided via `DATABASE_URL`.
- Images currently exist under `public/images/items` and `public/images/facilities`.
- We want Cloudflare R2 to host uploads via `@payloadcms/storage-s3` (version aligned with Payload).

## Goals / Non-Goals

**Goals:**

- Create Payload collections that normalize the dataset into `items`, `machines`, and `recipes`.
- Make the Payload database the canonical runtime data source (frontend reads from Payload, not from `db.json`).
- Implement an idempotent seed workflow that imports from `src/data/db.json` and can optionally import referenced images into `media` (R2-backed).

**Non-Goals:**

- Editorial workflows (drafts/publishing) for these collections.
- End-user auth / RBAC beyond what is needed for Payload admin.
- Treating `db.json` as a public API contract (it remains seed input).

## Decisions

### 1) Normalize into three collections: `items`, `machines`, `recipes`

**Decision:** Model the domain as three first-class collections:

- **Items**: unique by `itemId`, routable by unique `slug`, optional `image` relationship to `media`
- **Machines**: unique by `machineId`, optional `image` relationship to `media`
- **Recipes**: unique by `recipeId` (from `db.json.recipes[].id`), relationships to `machine` + item references in `ingredients[]` and `outputs[]`

**Rationale:** This removes denormalization (repeat item blobs per recipe), enables efficient queries (“all recipes that produce item X”), and matches the spec contract.

**Alternatives considered:**

- Keep the dataset as a single `recipes` collection and compute items at runtime → simpler schema, but expensive and error-prone.
- Model machines as items (“everything is an item”) → aligns with some in-game semantics, but complicates recipe browsing and machine-specific metadata.

### 2) Use stable external identifiers as unique keys

**Decision:** Store stable identifiers from `db.json` as unique fields:

- `items.itemId` (unique)
- `machines.machineId` (unique)
- `recipes.recipeId` (unique)

**Rationale:** Allows deterministic upserts during seeding and avoids accidental duplication.

**Alternatives considered:**

- Rely only on Payload internal IDs → harder to seed idempotently and to reconcile future dataset updates.

### 3) Represent manual crafting as a “machine”

**Decision:** Create a dedicated machine record for manual crafting (e.g. `machineId: "manual"`), and link `type: "manual"` recipes to it.

**Rationale:** Simplifies query/filters/UI by making `recipe.machine` always present and keeps the model consistent.

**Alternatives considered:**

- Allow `recipe.machine` to be null for manual → adds branching across UI + queries.

### 4) Public read access, restricted write access

**Decision:** `items`, `machines`, and `recipes` are publicly readable, while writes remain admin-only.

**Rationale:** The public site must render without authentication. Admin writes remain protected behind Payload auth.

**Security note:** If any Local API operation is performed “on behalf of a user”, we must set `overrideAccess: false`. The seed workflow will run as a trusted server-side operation (no user), so `overrideAccess` can remain at default.

### 5) Cloudflare R2 for media storage (via S3 adapter)

**Decision:** Add `@payloadcms/storage-s3` and configure it for the `media` collection.

**Rationale:** Cloud hosting for images, consistent with Payload’s storage adapter ecosystem.

**Alternatives considered:**

- Continue serving only from `public/` → simplest, but no centralized media management and no cloud storage.
- Use UploadThing → simpler setup, but smaller free tier (2GB) and bandwidth limits.

### 6) Seed workflow is idempotent and ordered

**Decision:** Seed in deterministic phases:

1. (Optional) Import media (item/machine images) and build a lookup map.
2. Upsert items by `itemId`.
3. Upsert machines by `machineId`.
4. Upsert recipes by `recipeId`, resolving relationships using the maps from steps 2–3.

**Rationale:** Relationships require referenced documents to exist. Idempotency enables re-running during development and future dataset refreshes.

**Alternatives considered:**

- Single pass with deferred relationship resolution → more complex, more error-prone.

### 7) Media deduplication via a stable “source path” field

**Decision:** Add a `sourcePath` (unique) field to `media` to deduplicate uploads when seeding from local files (e.g. `images/items/Aketine.png`).

**Rationale:** Upload collections otherwise lack a stable natural key; `filename` is not reliable enough across environments and the seed must be safe to re-run.

**Alternatives considered:**

- Hash file contents to dedupe → works but adds CPU cost and extra moving parts.

## Sequence diagrams

### Seed workflow (idempotent import)

```text
┌──────────────┐      ┌──────────────────┐      ┌───────────────────┐
│ Seed command │      │ Payload Local API│      │ PostgreSQL / Media │
└──────┬───────┘      └────────┬─────────┘      └─────────┬─────────┘
       │                       │                            │
       │ read src/data/db.json │                            │
       ├──────────────────────▶│                            │
       │                       │                            │
       │ (optional) upload     │ create/find media          │ store metadata + blobs
       │ local images          ├───────────────────────────▶│
       │                       │◀───────────────────────────┤
       │                       │                            │
       │ upsert items          │ find by itemId / update/create
       ├──────────────────────▶│───────────────────────────▶│
       │                       │◀───────────────────────────┤
       │                       │                            │
       │ upsert machines       │ find by machineId / update/create
       ├──────────────────────▶│───────────────────────────▶│
       │                       │◀───────────────────────────┤
       │                       │                            │
       │ upsert recipes        │ resolve relations + update/create
       ├──────────────────────▶│───────────────────────────▶│
       │                       │◀───────────────────────────┤
       │                       │                            │
       │ done                  │                            │
       └───────────────────────┴────────────────────────────┘
```

### Frontend read (server component)

```text
User request -> Next.js server component -> getPayload(Local API) -> Postgres
```

## Risks / Trade-offs

- **[Large initial import time]** → Mitigation: idempotent upserts; optional media import toggle; log progress.
- **[R2 network failures during media import]** → Mitigation: allow “data-only seed” mode; skip missing/failed images without failing whole seed.
- **[Slug collisions already disambiguated in db.json]** → Mitigation: keep `slug` unique constraint in `items`; seed fails fast if input violates uniqueness.
- **[Over-fetching relationships]** → Mitigation: keep `depth` low and use `select` in Local API reads.
- **[Accidental access-control bypass in user-context operations]** → Mitigation: only use `overrideAccess: false` when a `user` is provided; seed runs as trusted server process.

## Migration Plan

1. Add new collections (`items`, `machines`, `recipes`) and extend `media` (add `sourcePath` unique field).
2. Add Cloudflare R2 storage adapter configuration and env vars (`R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).
3. Run `payload generate:types` after schema changes.
4. Run the seed workflow against a fresh DB and validate counts and spot-check a few items/recipes.
5. Update frontend data access to read from Payload (fallback to JSON loader temporarily if needed).
6. Verify core user flows (items list, item detail, production chain, recipe browser).

Rollback:

- Disable Payload-backed reads and switch runtime back to loading `src/data/db.json`.
- Disable R2 storage plugin and continue serving images from `public/`.

## Open Questions

- Should we keep `localImagePath` / `machineImagePath` as fields in the DB (as provenance), or drop them after media import?
  - **Resolved:** Keep them in the DB for rollback plan in case we need to reference the original paths.
- Should `craftTime`, `rarity`, and `sortId` be stored as numbers (preferred for sorting) or preserve the string values from `db.json` exactly?
  - **Resolved:** Store as numbers (preferred for sorting and filtering).
