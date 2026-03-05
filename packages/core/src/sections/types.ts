import type { ResolverContext } from "../resolvers/types";

export type SectionRendererId = string;

export interface SectionModule<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  default: unknown;
  props?: TProps;
}

export interface SectionsResolverContext extends ResolverContext {
  sectionRenderer?: SectionRendererId;
}

export interface SectionRenderInput<
  TContext extends ResolverContext = ResolverContext,
> {
  component: unknown;
  props: Record<string, unknown>;
  ctx: TContext;
  resolverId: string;
}

export type SectionRenderer<
  TContext extends ResolverContext = ResolverContext,
> = (input: SectionRenderInput<TContext>) => Promise<string> | string;
