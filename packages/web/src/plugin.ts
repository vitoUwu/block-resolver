import type { CorePlugin, ResolverContext } from "../../core/src/index";

export interface WebContext {
  request: Request;
}

export function webPlugin<
  TBaseContext extends ResolverContext = Record<never, never>,
>(): CorePlugin<TBaseContext, WebContext> {
  return {
    name: "web",
    install() {},
  };
}
