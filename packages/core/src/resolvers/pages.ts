import { getSectionRenderer } from "../sections/registry";
import type {
  SectionModule,
  SectionsResolverContext,
} from "../sections/types";
import type { JsonLike } from "../utils/types";
import type {
  EmptyContext,
  Resolver,
  ResolverId,
  ResolverType,
} from "./types";

interface PageSection {
  resolverId: ResolverId;
  props?: Record<string, unknown>;
}

interface PageProps {
  path: string;
  name: string;
  sections: (PageSection | string)[];
  [key: string]: unknown;
}

type PagesResolverContext = SectionsResolverContext & {
  pageRenderer?: string;
};

export class PagesResolver<
  TContext extends PagesResolverContext = EmptyContext & PagesResolverContext,
>
  implements Resolver<TContext>
{
  public static type: ResolverType = "pages";

  get type(): ResolverType {
    return PagesResolver.type;
  }

  constructor(
    public id: ResolverId,
    public module: SectionModule,
  ) {}

  public async resolve(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    const rendererId = ctx.pageRenderer ?? ctx.sectionRenderer ?? "react";
    const renderer = getSectionRenderer<TContext>(rendererId);
    if (!renderer) {
      throw new Error(
        `No renderer registered for "${rendererId}". Register one before resolving pages.`,
      );
    }

    const mergedProps = {
      ...(this.module.props ?? {}),
      ...props,
    } as PageProps;

    return await renderer({
      component: this.module.default,
      props: {
        ...mergedProps,
      },
      ctx,
      resolverId: this.id,
    });
  }
}
