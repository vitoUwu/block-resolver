import type { JsonLike } from "../utils/types";

export type ResolverType = string;

export type ResolverId<
  TAppName extends string = string,
  TResolverType extends string = string,
  TIdentifier extends string = string,
> = `${TAppName}/${TResolverType}/${TIdentifier}` | (string & {});

export interface ResolverContext {
  request?: Request;
  [key: string]: unknown;
}

export type Resolver = {
  type: ResolverType;
  id: ResolverId;
  resolve: (
    props: Record<string, unknown>,
    ctx: ResolverContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
};

export type Resolvers = Map<ResolverType, Map<ResolverId, Resolver>>;
export type ResolverConstructor = new (id: ResolverId, module: any) => Resolver;
export type ResolverClass = ResolverConstructor & { type: ResolverType };
