# @block-resolver/react

React renderer adapter for `sections`/`pages` in block-resolver.

## What it does

- Registers a renderer (`react` by default) in core section registry.
- Renders React components to HTML string with `react-dom/server`.
- Keeps rendering concerns separate from core/web runtime.

## Quick start

```ts
import { init } from "@block-resolver/core";
import { webPlugin } from "@block-resolver/web";
import { reactSectionsPlugin } from "@block-resolver/react";

const base = await init({
  appName: "example",
  manifestRoots: ["./"],
});

const webState = await base.use(webPlugin());
const state = await webState.use(reactSectionsPlugin());
```

## How-to: custom renderer ID

```ts
await state.use(reactSectionsPlugin({ rendererId: "react-ssr" }));
```

Then set `ctx.sectionRenderer` / `ctx.pageRenderer` to select it.

## How-to: resolver context typing with web request

```ts
import type { WebContext } from "@block-resolver/web";
import type { ResolverContext } from "../manifest.types.gen";

type Ctx = ResolverContext<WebContext>;
```

This gives both:

- typed invoke/cache runtime helpers from manifest types
- `request` from web plugin

## Renderer selection rules

- Sections use `ctx.sectionRenderer ?? "react"`.
- Pages use `ctx.pageRenderer ?? ctx.sectionRenderer ?? "react"`.
- Registering the same renderer ID more than once is ignored (first
  registration wins).
- If no renderer is registered for the selected ID, resolving sections/pages
  throws.

## Main export

- `reactSectionsPlugin`
