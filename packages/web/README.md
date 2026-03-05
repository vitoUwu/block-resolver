# @block-resolver/web

HTTP adapter for `@block-resolver/core` with Bun-compatible fetch handlers.

## What it does

- Extends context with `request` via `webPlugin()`.
- Provides invoke routing helpers:
  - `createInvokeHandler(...)`
  - `createBunServeFetch(...)`
- Handles:
  - `/invoke/<resolver-or-block-id>`
  - direct page paths (`/`) by matching page block `props.path`
- Returns HTML responses for `sections` and `pages`.

## Quick start (Bun)

```ts
import { init } from "@block-resolver/core";
import { webPlugin, createBunServeFetch } from "@block-resolver/web";

const base = await init({
  appName: "example",
  manifestRoots: ["./"],
});
const state = await base.use(webPlugin());

const fetch = createBunServeFetch(state, {
  basePath: "/invoke",
  getContext: (request) => ({
    traceId: request.headers.get("x-trace-id") ?? "local",
  }),
});

Bun.serve({ port: 3000, fetch });
```

## How-to: use request in resolvers

Use generated resolver context merged with `WebContext`:

```ts
import type { WebContext } from "@block-resolver/web";
import type { GeneratedResolverContext } from "../manifest.types.gen";

export default function loader(
  _props: {},
  ctx: GeneratedResolverContext<WebContext>,
) {
  return { path: new URL(ctx.request.url).pathname };
}
```

## How-to: customize invoke base path

```ts
createBunServeFetch(state, { basePath: "/api/invoke" });
```

## Main exports

- `webPlugin`
- `createInvokeHandler`
- `createBunServeFetch`
- `WebContext`
