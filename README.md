# Block Resolver

This project is a block runtime inspired by Deco-style composition, with
first-party app installation and resolver-driven configuration.

## Packages

- `@block-resolver/core`: manifest/runtime/resolution/install APIs
- `@block-resolver/web`: HTTP invoke routing (`/invoke/*`) for Bun fetch
- `@block-resolver/react`: React server renderer for sections/pages
- `example`: reference site that installs `app-example`
- `app-example`: installable app with `mod.ts`, loaders, and actions

## First-party app installation (current model)

The site (`example`) installs apps through config + blocks, not by hardcoded
imports/parsing in server startup.

### 1) Declare installed apps in site config

`example/block-resolver.app.json`

```json
{
  "name": "example",
  "apps": ["app-example"]
}
```

### 2) Expose app entrypoint from site `apps/`

`example/apps/app-example.ts`

```ts
export { manifestRegistry } from "../../app-example/manifest.gen.ts";
export { default } from "../../app-example/mod.ts";
```

### 3) Configure app props in `.blocks`

`example/.blocks/app-example.json`

```json
{
  "resolverId": "core/apps/app-example",
  "props": {
    "apiBaseUrl": "https://httpbin.org",
    "token": {
      "resolverId": "app-example/loaders/encrypted",
      "props": {
        "name": "APP_EXAMPLE_TOKEN",
        "encrypted": "replace-with-encrypted-output"
      }
    }
  }
}
```

### 4) Install at startup

```ts
const state = await init({
  appName: "example",
  manifestRoots: ["./", "../app-example"],
});

const installed = await installConfiguredApps(state, {
  manifestRoots: ["./", "../app-example"],
});
```

Use `installed.ctx` when building request context.

## Runtime lifecycle

1. `init(...)` loads `.blocks`, writes manifests by default, and hydrates
   resolvers.
2. `installConfiguredApps(...)` registers `core/apps/*` resolvers from
   `example/apps/*`, resolves installed app blocks, and merges app contexts.
3. Plugins are applied (`webPlugin`, `reactSectionsPlugin`).
4. HTTP requests are resolved via `/invoke/*` or page-path mapping.

## Manifest generation

Preferred commands:

```bash
# from each app directory
bun run manifest:generate

# from monorepo root targeting a workspace
bun run --cwd example manifest:generate
bun run --cwd app-example manifest:generate
```

Generated files:

- `manifest.gen.ts`
- `manifest.types.gen.ts`

## App coding model (`mod.ts`)

Installable apps export a default `App(state)` function that returns:

- `manifest`
- `state` (can include nested resolvables)
- optional `init(resolvedState)` returning app context additions

This is implemented in `app-example/mod.ts`.

## Resolver types

- `loaders`
- `actions`
- `sections`
- `pages`
- `apps` (`core/apps/*` for installation)

## Documentation by package

- Core runtime and app install details: `packages/core/README.md`
- HTTP adapter: `packages/web/README.md`
- Installable app internals: `app-example/README.md`
