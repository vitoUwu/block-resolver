# example

Reference site app showing first-party app installation.

## Install flow

`example` installs `app-example` through config + block + app bridge:

1. `block-resolver.app.json` declares installed app IDs.
2. `apps/app-example.ts` bridges to `../../app-example/mod.ts`.
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

## Coding guidelines

- Do not hardcode app installation logic in `index.ts`.
- Keep installation config in `.blocks/<app>.json`.
- Keep app list in `block-resolver.app.json`.
- Keep `apps/*.ts` as thin re-export bridges.
- Prefer block-level nested resolvables for dynamic install config.
