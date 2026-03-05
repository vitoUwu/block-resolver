import { loadBlocks } from "../block/load";
import { resolveBlock } from "../block/resolver";
import type { Block, Blocks } from "../block/types";
import { loadResolvers } from "../resolvers/registry";
import type {
  ResolverContext,
  ResolverId,
  Resolvers,
} from "../resolvers/types";
import type { JsonLike } from "../utils/types";

export interface StateType {
  blocks: Blocks;
  resolvers: Resolvers;
}

export class State implements StateType {
  public blocks: Blocks = new Map();
  public resolvers: Resolvers = new Map();

  public setBlocks(blocks: Map<string, Block>) {
    this.blocks = blocks;
    return this;
  }

  public async init() {
    this.blocks = await loadBlocks();
    this.resolvers = await loadResolvers();
  }

  public async resolve(
    resolverId: ResolverId,
    props: Record<string, unknown> = {},
    ctx: ResolverContext = {},
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
