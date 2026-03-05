import { State } from "./state/state";

export async function init() {
  const state = new State();
  await state.init();
  return state;
}

export { State } from "./state/state";
export { LoaderResolver } from "./resolvers/loader";
export { registerResolver } from "./resolvers/registry";
export type {
  Resolver,
  ResolverClass,
  ResolverContext,
  ResolverId,
  Resolvers,
  ResolverType,
} from "./resolvers/types";
export type { Block, Blocks } from "./block/types";
export type { JsonLike } from "./utils/types";
