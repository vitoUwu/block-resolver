import type {
  ResolverContext,
  ResolverId,
  Resolvers,
} from "../resolvers/types";
import type { JsonLike } from "../utils/types";
import { resolved as nullReference } from "./blocks/null-reference";
import type { Blocks } from "./types";

function isLikelyGlobalResolverId(resolverId: string): boolean {
  const [appName, resolverType, ...rest] = resolverId.split("/");
  return !!appName && !resolverType && rest.length === 0;
}

export async function resolveBlock(
  resolverId: ResolverId,
  props: Record<string, unknown>,
  options: {
    blocks: Blocks;
    resolvers: Resolvers;
  },
  ctx: ResolverContext = {},
): Promise<JsonLike | Response> {
  if (isLikelyGlobalResolverId(resolverId)) {
    const block = options.blocks.get(resolverId);
    if (!block) {
      return nullReference;
    }

    return resolveBlock(block.resolverId, props, options, ctx);
  }

  const [appName, resolverType] = resolverId.split("/");
  if (!appName || !resolverType) {
    throw new Error(`Invalid resolver ID: ${resolverId}`);
  }

  const resolver = options.resolvers.get(resolverType)?.get(resolverId);
  if (!resolver) {
    return nullReference;
  }

  return await resolver.resolve(props, ctx);
}
