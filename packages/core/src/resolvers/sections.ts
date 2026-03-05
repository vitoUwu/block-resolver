import type { JsonLike } from "../utils/types";
import type {
  EmptyContext,
  Resolver,
  ResolverId,
  ResolverType,
} from "./types";
import { getSectionRenderer } from "../sections/registry";
import type { SectionModule, SectionsResolverContext } from "../sections/types";

export class SectionsResolver<
  TContext extends SectionsResolverContext = EmptyContext & SectionsResolverContext,
>
  implements Resolver<TContext>
{
  public static type: ResolverType = "sections";

  get type(): ResolverType {
    return SectionsResolver.type;
  }

  constructor(
    public id: ResolverId,
    public module: SectionModule,
  ) {}

  public async resolve(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    const rendererId = ctx.sectionRenderer ?? "react";
    const renderer = getSectionRenderer<TContext>(rendererId);
    if (!renderer) {
      throw new Error(
        `No renderer registered for "${rendererId}". Register one before resolving sections.`,
      );
    }

    const mergedProps = {
      ...(this.module.props ?? {}),
      ...props,
    };

    return await renderer({
      component: this.module.default,
      props: mergedProps,
      ctx,
      resolverId: this.id,
    });
  }
}
