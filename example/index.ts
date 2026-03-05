import { init } from "@block-resolver/core";
import { createInvokeHandler, webPlugin } from "@block-resolver/web";

const baseState = await init();
const state = await baseState.use(webPlugin());

const directResult = await state.resolve(
  "app/loaders/echo",
  { message: "hello from direct call" },
  {
    request: new Request("http://localhost:3000/direct"),
  },
);

const invoke = createInvokeHandler(state);
const response = await invoke(
  new Request("http://localhost:3000/invoke/app/loaders/echo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "hello from http route" }),
  }),
);

console.log(directResult instanceof Response ? await directResult.json() : directResult);
console.log(await response.json());
