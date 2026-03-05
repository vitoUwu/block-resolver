import { loadBlocks } from "../block/load";
import { resolveBlock } from "../block/resolver";
import type { Block, Blocks } from "../block/types";
import type { CorePlugin } from "../plugin";
import { loadResolvers } from "../resolvers/registry";
import type {
  EmptyContext,
  ResolverContext,
  ResolverId,
  Resolvers,
} from "../resolvers/types";
import type { JsonLike } from "../utils/types";

export interface StateType<TContext extends ResolverContext = EmptyContext> {
  blocks: Blocks;
  resolvers: Resolvers<TContext>;
}

export class State<TContext extends ResolverContext = EmptyContext>
  implements StateType<TContext>
{
  public blocks: Blocks = new Map();
  public resolvers: Resolvers<TContext> = new Map();

  public setBlocks(blocks: Map<string, Block>) {
    this.blocks = blocks;
    return this;
  }

  public async init() {
    this.blocks = await loadBlocks();
    this.resolvers = await loadResolvers<TContext>();
  }

  public async use<TAddedContext extends ResolverContext>(
    plugin: CorePlugin<TContext, TAddedContext>,
  ): Promise<State<TContext & TAddedContext>> {
    const nextState = this as unknown as State<TContext & TAddedContext>;
    await plugin.install(nextState);
    return nextState;
  }

  public async resolve(
    resolverId: ResolverId,
    props: Record<string, unknown> = {},
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    return await resolveBlock(
      resolverId,
      props,
      {
        blocks: this.blocks,
        resolvers: this.resolvers,
      },
      ctx,
    );
  }
}
