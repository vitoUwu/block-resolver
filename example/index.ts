import {
  init,
  InMemoryCacheStore,
  installConfiguredApps,
} from "@block-resolver/core";
import { reactSectionsPlugin } from "@block-resolver/react";
import { createBunServeFetch, webPlugin } from "@block-resolver/web";
import type { ResolverInvokeMap } from "./manifest.types.gen";

const baseState = await init<ResolverInvokeMap>({
  appName: "example",
  cacheStore: new InMemoryCacheStore(),
});
const installedApps = await installConfiguredApps(baseState);
const webState = await baseState.use(webPlugin());
const state = await webState.use(reactSectionsPlugin());

const fetch = createBunServeFetch(state, {
  basePath: "/invoke",
  getContext: (request) => ({
    ...installedApps.ctx,
    traceId: request.headers.get("x-trace-id") ?? "local",
  }),
});

const server = Bun.serve({
  port: 3000,
  fetch,
});

console.log(`Server running at ${server.url}`);
console.log(`Try: ${server.url}`);
