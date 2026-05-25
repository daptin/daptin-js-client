# Goal: Finish the Daptin JavaScript SDK

Prepared: 2026-05-25

## Current SDK State

This SDK is already a Daptin-specific wrapper around `devour-client`, not a blank client. `DaptinClient` in `lib/main.ts` exposes:

- `jsonApi` for generic JSON:API access through Devour.
- `actionManager`, `authManager`, `worldManager`, `statsManager`, `configManager`, `aggregateClient`, `assetManager`, `integrationManager`, `runtimeManager`, `llmManager`, `graphqlManager`, `yjsManager`, `stateMachineManager`, `feedManager`, and `liveManager`.
- request-shape tests for most newer managers under `test/`.

The current code has no `relationshipManager`, no relationship helper in `DaptinClient`, and no README section for Daptin relationship endpoints. Searching `lib`, `test`, and `README.md` shows no supported SDK surface for relationship operations beyond consumers using `jsonApi` or raw HTTP themselves.

## Live GitHub Scope

The live open issue set for `daptin/daptin-js-client`, checked on 2026-05-25, is:

- [#17 Fix package repository metadata to point at daptin/daptin-js-client](https://github.com/daptin/daptin-js-client/issues/17)
- [#18 Add first-class support for Daptin relationship endpoints](https://github.com/daptin/daptin-js-client/issues/18)

`npm view daptin-client@latest repository bugs homepage --json` still reports the stale `daptin/daptin-client-js` repository metadata for published `0.7.8`, so #17 must be verified from npm after publish, not only fixed locally.

## Goal Statement

Ship the next `daptin-client` release as the complete supported SDK surface for the currently known Daptin dashboard needs: keep the existing manager-based API, discover the exact Daptin relationship request and response shapes from a real Daptin instance before writing SDK code, add a first-class relationship manager for the verified route shape, correct package metadata, document the supported calls, and verify the published package against npm and a real Daptin server.

## Hard Gate: Discover API Shapes Before Code

Do not implement relationship SDK code from wiki text, issue text, guessed JSON:API conventions, or mocked test assumptions.

Before any SDK code change for #18:

- Bring up an independent throwaway Daptin instance using a fresh database, storage path, cache path, and port. Do not reuse an existing long-lived local Daptin server.
- Prefer the available local Daptin binary at `/Users/artpar/go/bin/daptin` or the adjacent `/Users/artpar/workspace/code/github.com/daptin/daptin` checkout; Docker is acceptable if it is easier to isolate.
- Create or load a minimal relation-bearing schema that exercises:
  - nullable single relation
  - multi-value relation
  - at least one default/system relation such as usergroup membership if practical
- Capture the exact HTTP request and response shape for each operation before choosing the SDK method semantics:
  - fetch related records
  - set or replace a single relation
  - clear a nullable single relation
  - set or replace a multi-value relation
  - remove one value from a multi-value relation if Daptin supports a distinct removal shape
  - representative error response for an invalid relation key or invalid target id
- Record the evidence in a checked-in artifact such as `docs/relationship-api-shapes.md` or a test fixture directory before implementing the manager.
- Treat any API shape shown later in this goal as a hypothesis until the live Daptin evidence confirms it.

No relationship SDK code should be written, reviewed, or merged until this evidence exists.

## Required Code Changes

### 1. Fix package metadata

Update `package.json` and the lockfile metadata to point at the real repository:

- `repository.url`: `git+https://github.com/daptin/daptin-js-client.git`
- `bugs.url`: `https://github.com/daptin/daptin-js-client/issues`
- `homepage`: `https://github.com/daptin/daptin-js-client#readme`

### 2. Add a relationship manager

After the API shape discovery gate is complete, add a new manager following the current SDK pattern:

- New source file: `lib/clients/relationshipmanager.ts`
- Wire it into `DaptinClient` in `lib/main.ts` as `relationshipManager`.
- Use the shared `AppConfig`, `TokenGetter`, and Axios instance pattern used by `ConfigManager`, `IntegrationManager`, `LlmManager`, and `StateMachineManager`.
- Add `test/relationshipmanager.test.ts` for request shape and response behavior.

The public API should be Daptin-specific and should not ask consumers to know Devour internals. A concrete target shape:

```ts
client.relationshipManager.fetch(entity, referenceId, relationKey, params?)
client.relationshipManager.set(entity, referenceId, relationKey, target)
client.relationshipManager.setMany(entity, referenceId, relationKey, targets)
client.relationshipManager.clear(entity, referenceId, relationKey)
client.relationshipManager.remove(entity, referenceId, relationKey, target)
```

Where `target` can be `{ type, id }`, `null`, or a string id when the related type is supplied through options, only if the live Daptin evidence supports those inputs. Keep the implementation small if the Daptin runtime only supports PATCH replacement semantics; do not invent server semantics that are not present.

### 3. Match Daptin's relationship route shape

The manager must use the route and payload shapes proven by the live Daptin instance. The expected shape from #18 to verify is:

- Fetch related data with `GET /api/{entity}/{reference_id}/{relation_key}`.
- Write relationship data with `PATCH /api/{entity}/{reference_id}` and a JSON:API relationship payload:

```json
{
  "data": {
    "type": "cloud_store",
    "id": "store-reference-id",
    "relationships": {
      "credential_id": {
        "data": {
          "type": "credential",
          "id": "credential-reference-id"
        }
      }
    }
  }
}
```

Relationship keys are expected to be Daptin relation/FK keys such as `credential_id`, `usergroup_id`, `cloud_store_id`, and `mail_server_id`. Confirm this against the real instance before implementation. The SDK should not expose join-table names or display labels as the normal API unless live evidence shows that Daptin requires that shape.

### 4. Preserve runtime response details

The manager should return `response.data` without normalizing away Daptin fields. This matters because relation endpoint responses can include metadata such as:

- `relation_reference_id`
- `relation_created_at`

Callers must be able to read those fields directly from the SDK response.

### 5. Keep auth behavior consistent

For authenticated calls, use `Authorization: Bearer <token>`.

If `tokenGetter.getToken()` returns an empty, null, or undefined token, omit the `Authorization` header. This matches the newer `ActionManager` behavior and prevents `Bearer null` style requests.

## Documentation Changes

Update `README.md` with a `Relationship APIs` section based on the captured real request and response shapes. It should show:

- Fetching related records by relation key.
- Linking a single relation, for example `cloud_store.credential_id`.
- Clearing a nullable single relation.
- Replacing a multi-value relation such as usergroup membership.
- Reading `relation_reference_id` from a relationship response.

The docs should explicitly say that consumers pass Daptin relation/FK keys, not join-table names.

## Verification Plan

Local verification:

- `npm test`
- `npm run build`
- `npm pack --dry-run`

Focused tests must cover:

- GET path: `/api/{entity}/{referenceId}/{relationKey}`
- PATCH path: `/api/{entity}/{referenceId}`
- single relationship payload
- array relationship payload
- clear relationship payload
- query params on fetch
- no `Authorization` header when token is absent
- response metadata is preserved

Real-instance verification is mandatory for every SDK behavioral change. The implementation pass must run against a fresh Daptin server, not only mocks:

- Create an isolated real relation-bearing setup.
- Fetch a relation through `relationshipManager.fetch`.
- Link or replace a single relation through `relationshipManager.set`.
- Clear a nullable relation if supported by that schema.
- Set or replace a multi-value relation through `relationshipManager.setMany`.
- Confirm any returned relation metadata is visible to the SDK caller.
- Save the commands, key request payloads, and key response excerpts in the verification notes for the release or issue comment.

Do not close #18 from mocked tests alone.

## Release Completion

After code, docs, and live verification:

- Bump the package version.
- Publish `daptin-client`.
- Verify npm registry state:

```bash
npm view daptin-client version dist-tags.latest --json
npm view daptin-client@latest repository bugs homepage --json
```

- Install the published package in a clean temporary consumer project and run a minimal import plus relationship-manager smoke check.
- Comment on and close #17 only after npm metadata points to `daptin/daptin-js-client`.
- Comment on and close #18 only after the relationship manager is verified against a real Daptin server.

## Definition of Done

This goal is done when:

- `DaptinClient` exposes `relationshipManager`.
- The relationship manager supports Daptin fetch, set, clear, and multi-relation payloads using the real Daptin route shape.
- README usage matches the implemented API.
- The API shape evidence was captured from a real throwaway Daptin instance before SDK code was written.
- Tests, build, pack dry-run, real Daptin smoke, npm publish verification, and clean consumer install all pass.
- #17 and #18 are closed with comments pointing to the verified release.
