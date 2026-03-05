import { init } from "@block-resolver/core";
import { createBunServeFetch, webPlugin } from "@block-resolver/web";

const baseState = await init();
const state = await baseState.use(webPlugin());

const fetch = createBunServeFetch(state, {
  basePath: "/invoke",
  getContext: (request) => ({
    traceId: request.headers.get("x-trace-id") ?? "local",
  }),
});

const server = Bun.serve({
  port: 3000,
  fetch,
});

console.log(`Server running at ${server.url}`);
