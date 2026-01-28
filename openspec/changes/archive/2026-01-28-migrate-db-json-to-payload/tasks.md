## 1. Storage + environment setup

- [x] 1.1 Add dependency `@payloadcms/storage-s3` (version aligned with current Payload) and install with pnpm
- [x] 1.2 Update `src/payload.config.ts` to configure Cloudflare R2 storage for the `media` collection
- [x] 1.3 Add R2 env vars to `.env.example` and document required env vars for deployment

### Cloudflare R2 Setup Guide

1. **Create Cloudflare account** (if needed): https://dash.cloudflare.com/sign-up

2. **Create R2 bucket**:
   - Go to R2 in the Cloudflare dashboard
   - Click "Create bucket"
   - Name it (e.g., `endfields-media`)
   - Choose location hint (optional)

3. **Create API token**:
   - Go to R2 → Overview → "Manage R2 API Tokens"
   - Click "Create API token"
   - Give it a name (e.g., `payload-s3-adapter`)
   - Permissions: "Object Read & Write"
   - Specify bucket (or all buckets)
   - Click "Create API Token"
   - **Copy and save the Access Key ID and Secret Access Key** (shown only once)

4. **Get your Account ID**:
   - Find it in the Cloudflare dashboard URL or R2 overview page
   - Format: 32-character hex string

5. **Configure environment variables**:

   ```bash
   R2_BUCKET=your-bucket-name
   R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=<access_key_id>
   R2_SECRET_ACCESS_KEY=<secret_access_key>
   ```

6. **(Optional) Set up public access**:
   - For public image serving, enable R2 public access:
   - R2 → Your bucket → Settings → Public access
   - Connect a custom domain or use the r2.dev subdomain
   - Set `R2_PUBLIC_URL` to your public URL

## 2. Payload collections (Items / Machines / Recipes)

- [x] 2.1 Create `items` collection (unique `itemId`, unique `slug`, optional `image` upload relation, public read access)
- [x] 2.2 Create `machines` collection (unique `machineId`, name, optional `image` upload relation, public read access)
- [x] 2.3 Create `recipes` collection (unique `recipeId`, `type`, `category`, `machine` relation, `ingredients[]` + `outputs[]` relations with counts, public read access)
- [x] 2.4 Extend `media` collection to support seed de-duplication (e.g. add unique `sourcePath` field; ensure images-only mime types)
- [x] 2.5 Register new collections in `src/payload.config.ts`
- [x] 2.6 Run `pnpm generate:types` to refresh generated Payload types after schema changes

## 3. Idempotent seed workflow

- [x] 3.1 Add a seed script (TypeScript) that loads `src/data/db.json` and imports data into Payload/Postgres
- [x] 3.2 Implement deterministic upsert logic for:
  - items keyed by `itemId`
  - machines keyed by `machineId` (including a dedicated "manual" machine)
  - recipes keyed by `recipeId`
- [x] 3.3 Implement optional media import:
  - resolve `items[].localImagePath` and `recipes[].machineImagePath` to files under `public/`
  - create/find `media` by a stable key (e.g. `sourcePath`) and link to the corresponding item/machine
- [x] 3.4 Ensure missing images do not fail the seed (skip safely and continue)
- [x] 3.5 Add a `pnpm seed` script (using `tsx`) and document how to run it against a configured `DATABASE_URL`

## 4. Switch runtime data source to Payload

- [x] 4.1 Add server-side data access helpers to query Payload for:
  - item by `slug`
  - recipes that produce / consume an item (by relationship)
  - recipe browser queries (filters + search + sorting)
- [x] 4.2 Update items list and item detail routes to load from Payload/Postgres instead of importing `db.json`
- [x] 4.3 Update recipe browser to load recipe rows from Payload/Postgres instead of importing `db.json`
- [x] 4.4 Update production chain builder to consume Payload-sourced data while keeping internal identity keyed by `itemId` and navigation keyed by `slug`

## 5. Verification + rollback readiness

- [x] 5.1 Run `pnpm lint` and `tsc --noEmit` (and fix any newly introduced issues)
- [x] 5.2 Run the seed workflow on a clean database and validate:
  - item count matches `db.json.items.length`
  - recipe count matches `db.json.recipes.length`
  - spot-check relationships (ingredients/outputs) for a few recipes
- [x] 5.3 Verify media uploads work in Payload admin (stored via R2 when enabled)
- [x] 5.4 Keep a rollback path (temporary feature flag or fallback) to load from `src/data/db.json` if Payload reads are not available
