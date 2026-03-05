# example

Reference site app showing first-party app installation.

## Install flow

`example` installs `app-example` through config + block + app bridge:

1. `block-resolver.app.json` declares installed app IDs.
2. `apps/app-example.ts` bridges to `../../app-example/mod.ts` and
   `../../app-example/manifest.gen.ts`.
3. `.blocks/app-example.json` configures app state using `core/apps/app-example`.
4. startup calls `installConfiguredApps(...)`.

## Key files

- `index.ts`: app startup and request handling
- `block-resolver.app.json`: site app metadata + installed apps list
- `apps/app-example.ts`: app entrypoint bridge
- `.blocks/app-example.json`: install-time app props/config
- `.blocks/home-page.json`, `.blocks/Header.json`: page/section block graph

## Runtime behavior

- Core registers `core/apps/*` resolvers from `apps/`.
- Core resolves installed app blocks in order from `apps` list.
- Each installed app contributes context merged into request context.
- Section/page/loaders can consume installed app resolvers by ID.

## Request lifecycle

1. Startup: `init(...)` -> `installConfiguredApps(...)` -> plugins -> Bun server.
2. Request enters web router:
   - `/invoke/<id>` resolves explicit resolver/block ID.
   - other paths (`/`, `/about`, etc.) resolve by page block `props.path`.
3. Request context merges:
   - installed app context (`installedApps.ctx`)
   - per-request values (`traceId`, etc.)
   - `request` from web plugin.

## Manifest generation

```bash
bun run manifest:generate
```

This generates/updates:

- `manifest.gen.ts`
- `manifest.types.gen.ts`

## Coding guidelines

- Do not hardcode app installation logic in `index.ts`.
- Keep installation config in `.blocks/<app>.json`.
- Keep app list in `block-resolver.app.json`.
- Keep `apps/*.ts` as thin re-export bridges.
- Prefer block-level nested resolvables for dynamic install config.
