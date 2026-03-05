import { State } from "./state/state";
import type { EmptyContext } from "./resolvers/types";

export async function init() {
  const state = new State<EmptyContext>();
  await state.init();
  return state;
}

export { State } from "./state/state";
export type { CorePlugin } from "./plugin";
export { LoaderResolver } from "./resolvers/loader";
export { registerResolver } from "./resolvers/registry";
export type {
  EmptyContext,
  Resolver,
  ResolverClass,
  ResolverContext,
  ResolverId,
  Resolvers,
  ResolverType,
} from "./resolvers/types";
export type { Block, Blocks } from "./block/types";
export type { JsonLike } from "./utils/types";
