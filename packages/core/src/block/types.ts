import type { ResolverId } from "../resolvers/types";

export interface Block<TProps = Record<string, unknown>> {
  resolverId: ResolverId;
  props?: TProps;
}

export type Blocks = Map<string, Block>;
