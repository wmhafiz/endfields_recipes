## Why

We currently ship recipe + item data from a static JSON file (`src/data/db.json`). Migrating this dataset into Payload CMS (Postgres) enables a scalable, queryable source of truth and sets us up for future admin-managed updates while keeping the frontend UX the same.

## Goals

- Move the enriched `db.json` dataset into PostgreSQL via Payload CMS collections.
- Normalize the denormalized dataset into `Items`, `Machines`, and `Recipes` with explicit relationships.
- Add an idempotent seed workflow to populate the database from the current `db.json` (and optionally import item/machine images).
- Configure media storage using Cloudflare R2 via the S3 storage adapter for Payload.

## Non-goals

- Building a full editorial workflow (drafts, moderation, publishing) for recipes/items.
- Adding end-user accounts / RBAC beyond what’s needed to operate Payload admin.
- Guaranteeing backward compatibility for any external consumers of the static JSON file (we will keep `db.json` as seed input, not a public API contract).

## What Changes

- Add Payload collections for:
  - `items` (unique by `itemId`, `slug`)
  - `machines` (unique by `machineId`, with optional image)
  - `recipes` (unique by `recipeId`, linking to `items` + `machines`)
- Add a seed/import script that reads `src/data/db.json` and upserts all documents into Postgres.
- Add Cloudflare R2 storage adapter configuration (via `@payloadcms/storage-s3`) for the `media` upload collection.
- Update runtime data access to read from Payload/Postgres instead of importing `db.json` directly.

## Capabilities

### New Capabilities

- `payload-recipes-database`: Payload-backed collections for Items, Machines, and Recipes stored in PostgreSQL and queryable via Payload APIs.
- `payload-db-seeding`: A repeatable seed workflow that imports the current enriched `src/data/db.json` (and related images) into the Payload database.

### Modified Capabilities

- `recipe-data-source`: The canonical runtime data source shifts from local `src/data/db.json` to Payload CMS (Postgres). `db.json` becomes an import/seed input rather than the runtime source of truth.

## Impact

- **Backend / schema**: new Payload collection configs; regenerated Payload types; new DB tables/migrations managed by Payload Postgres adapter.
- **Dependencies**: add `@payloadcms/storage-s3` (version-aligned with existing Payload packages).
- **Configuration**: new env vars for Cloudflare R2 (bucket, endpoint, access keys); update `src/payload.config.ts` plugins.
- **Data migration**: seed script must be idempotent and safe to re-run; will need a strategy for mapping existing local image paths (`public/images/...`) into `media` uploads.
- **Frontend**: data-loading logic moves from filesystem JSON reads to Payload queries (Local API in server components or REST/GraphQL, as appropriate).

## Rollback plan

- Keep `src/data/db.json` in repo and retain the existing JSON-based data loader behind a feature flag or a simple fallback path.
- If issues arise with DB or seed/import, disable the Payload-backed path and revert the frontend to reading `db.json` directly.
- Remove/disable R2 storage adapter config and continue serving images from `public/` while investigating.
