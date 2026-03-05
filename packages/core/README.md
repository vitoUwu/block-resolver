# @block-resolver/core

Core runtime for resolver execution, app installation, manifest hydration, and
context composition.

## Resolver model

Resolver IDs are namespaced:

`<app-name>/<resolver-type>/<identifier>`

Examples:

- `example/loaders/title`
- `example/sections/header`
- `app-example/actions/secrets/encrypt`
- `core/apps/app-example`

Supported resolver types in runtime:

- `loaders`
- `actions`
- `sections`
- `pages`
- `apps` (first-party installer resolver type)

## App installation model

App installation is block-driven and first-party:

1. Site app config (`block-resolver.app.json`) lists installed app block IDs.
2. Site `apps/` folder exposes app entrypoints for installation.
3. `.blocks/<installed-app>.json` points to `core/apps/<app-name>` and contains
   app state/config.
4. `installConfiguredApps(...)` registers `core/apps/*` resolvers and resolves
   each configured app block in order.
5. Each installed app contributes to merged runtime context (`ctx`).

### Required site config

```json
{
  "name": "example",
  "apps": ["app-example"]
}
```

### Required site app export

`example/apps/app-example.ts`

```ts
export { manifestRegistry } from "../../app-example/manifest.gen.ts";
export { default } from "../../app-example/mod.ts";
```

### Required app install block

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

## App authoring contract (`mod.ts`)

Apps follow a Deco-like shape:

```ts
import manifest from "./manifest.gen";
import type { AppModule } from "@block-resolver/core";

export interface State {
  apiBaseUrl: string;
  token: string | { resolverId: string; props?: Record<string, unknown> };
}

type App = AppModule<typeof manifest, State, { client: unknown }>;

export default function App(state: State): App {
  return {
    manifest,
    state,
    async init(resolvedState) {
      return {
        client: createClient(resolvedState.apiBaseUrl),
      };
    },
  };
}
```

Key points:

- `state` may include nested resolvables (`{ resolverId, props }`)
- runtime resolves `state` before calling `init`
- `init` returns app context additions merged into site request context

## Startup usage

```ts
import { init, installConfiguredApps, InMemoryCacheStore } from "@block-resolver/core";

const baseState = await init({
  appName: "example",
  manifestRoots: ["./", "../app-example"],
  cacheStore: new InMemoryCacheStore(),
});

const installedApps = await installConfiguredApps(baseState, {
  manifestRoots: ["./", "../app-example"],
});

// installedApps.ctx -> merged app context for request handling
```

## Resolver and block resolution semantics

- Resolver IDs follow `<app>/<type>/<id>`.
- Global block IDs (for example `Header` or `home-page`) are resolved from
  `.blocks/<id>.json`.
- Nested resolvables (`{ resolverId, props }`) are resolved recursively inside
  props/state.
- Missing blocks/resolvers resolve to a `null-reference` object instead of
  throwing.

## Manifest generation behavior

- `init(...)` uses `writeManifestFiles: true` by default.
- Runtime generator scans app roots (folders containing
  `block-resolver.app.json`) and emits:
  - `manifest.gen.ts`
  - `manifest.types.gen.ts`
- Resolver folders included in generation:
  - `loaders`, `actions`, `sections`, `pages`

CLI options:

```bash
# from app directory
bun run manifest:generate

# or directly
bunx block-resolver-manifest .
```

## Coding guidelines for app authors

- Keep loaders/actions pure whenever possible.
- Put shared clients/factories in `mod.ts` `init`, not inside individual
  resolvers.
- Resolve secrets via loaders (`app-example/loaders/encrypted`) instead of
  hardcoding plaintext values.
- Prefer nested resolvables in app block props for dynamic config.
- Return serializable values from loaders/actions unless an HTTP `Response` is
  required.
- Use generated `manifest.types.gen.ts` for typed invoke contracts.

## Main exports

- Runtime: `init`, `State`
- App install/runtime: `installConfiguredApps`, `instantiateApp`, `AppModule`
- Resolvers: `LoaderResolver`, `ActionsResolver`, `SectionsResolver`,
  `PagesResolver`, `AppsResolver`
- Manifest runtime: `buildManifestRegistryFromRoots`,
  `writeManifestFilesForRoots`
- Caching: `InMemoryCacheStore`, `LoaderCacheStore`, `LoaderCacheConfig`
