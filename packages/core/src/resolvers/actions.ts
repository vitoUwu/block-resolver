import type { JsonLike } from "../utils/types";
import type {
  EmptyContext,
  Resolver,
  ResolverContext,
  ResolverId,
  ResolverType,
} from "./types";

interface ActionModule<TContext extends ResolverContext = EmptyContext> {
  default: (
    props: Record<string, unknown>,
    ctx: TContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
}

export class ActionsResolver<TContext extends ResolverContext = EmptyContext>
  implements Resolver<TContext>
{
  public static type: ResolverType = "actions";

  get type(): ResolverType {
    return ActionsResolver.type;
  }

  constructor(
    public id: ResolverId,
    public module: ActionModule<TContext>,
  ) {}

  public resolve(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> | JsonLike | Response {
    return this.module.default(props, ctx);
  }
}
