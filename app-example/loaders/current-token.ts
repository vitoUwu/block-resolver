import type { AppExampleContext } from "../types";

export default function currentTokenLoader(
  _props: Record<string, never>,
  ctx: AppExampleContext,
) {
  return ctx.appExample.token;
}
