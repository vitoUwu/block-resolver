import type { ResolverContext } from "./resolvers/types";
import type { State } from "./state/state";

export interface CorePlugin<
  TBaseContext extends ResolverContext,
  TAddedContext extends ResolverContext,
> {
  name: string;
  install: (
    state: State<TBaseContext & TAddedContext>,
  ) => void | Promise<void>;
}
