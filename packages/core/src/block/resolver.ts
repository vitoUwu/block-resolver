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

function isResolvableReference(value: unknown): value is {
  resolverId: ResolverId;
  props?: Record<string, unknown>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return "resolverId" in value && typeof value.resolverId === "string";
}

async function unwrapNestedResolvedValue(
  resolved: JsonLike | Response,
): Promise<unknown> {
  if (!(resolved instanceof Response)) {
    return resolved;
  }

  const contentType = resolved.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await resolved.json();
  }

  return await resolved.text();
}

async function resolveNestedResolvables<TContext extends ResolverContext>(
  value: unknown,
  options: {
    blocks: Blocks;
    resolvers: Resolvers<TContext>;
  },
  ctx: TContext,
): Promise<unknown> {
  if (isResolvableReference(value)) {
    const resolved = await resolveBlock(
      value.resolverId,
      value.props ?? {},
      options,
      ctx,
    );
    return await unwrapNestedResolvedValue(resolved);
  }

  if (Array.isArray(value)) {
    return await Promise.all(
      value.map(async (item) => await resolveNestedResolvables(item, options, ctx)),
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value);
  const nextEntries = await Promise.all(
    entries.map(async ([key, nestedValue]) => [
      key,
      await resolveNestedResolvables(nestedValue, options, ctx),
    ]),
  );

  return Object.fromEntries(nextEntries);
}

export async function resolveBlock<TContext extends ResolverContext>(
  resolverId: ResolverId,
  props: Record<string, unknown>,
  options: {
    blocks: Blocks;
    resolvers: Resolvers<TContext>;
  },
  ctx: TContext,
): Promise<JsonLike | Response> {
  if (isLikelyGlobalResolverId(resolverId)) {
    const block = options.blocks.get(resolverId);
    if (!block) {
      return nullReference;
    }

    const mergedProps = {
      ...(block.props ?? {}),
      ...props,
    };

    return resolveBlock(block.resolverId, mergedProps, options, ctx);
  }

  const [appName, resolverType] = resolverId.split("/");
  if (!appName || !resolverType) {
    throw new Error(`Invalid resolver ID: ${resolverId}`);
  }

  const resolver = options.resolvers.get(resolverType)?.get(resolverId);
  if (!resolver) {
    return nullReference;
  }

  const resolvedProps = (await resolveNestedResolvables(
    props,
    options,
    ctx,
  )) as Record<string, unknown>;

  return await resolver.resolve(resolvedProps, ctx);
}
