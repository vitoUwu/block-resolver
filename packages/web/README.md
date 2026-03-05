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
import type { ResolverContext } from "../manifest.types.gen";

export default function loader(
  _props: {},
  ctx: ResolverContext<WebContext>,
) {
  return { path: new URL(ctx.request.url).pathname };
}
```

## How-to: customize invoke base path

```ts
createBunServeFetch(state, { basePath: "/api/invoke" });
```

## Routing and response behavior

- `/invoke/<resolver-or-block-id>` resolves directly.
- Any non-`/invoke` path is matched against page blocks by `props.path`.
- `GET` requests map query params to props.
- Non-`GET` requests only parse JSON object bodies; otherwise props are `{}`.
- Sections/pages return HTML (`text/html`) when resolver output is a string.
- Other outputs return JSON via `Response.json(...)`.

Status behavior:

- `400`: missing resolver path under invoke base path.
- `404`: no page block found for current pathname.
- `500`: resolver threw; response body is `{ error: string }`.

## Main exports

- `webPlugin`
- `createInvokeHandler`
- `createBunServeFetch`
- `WebContext`
