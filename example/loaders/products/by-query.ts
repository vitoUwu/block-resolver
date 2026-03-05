import type { WebContext } from "@block-resolver/web";
import type { ResolverContext } from "../../manifest.types.gen";
import type { VtexProduct } from "./list";

interface Props {
  query: string;
  count?: number;
}

export default async function productsByQuery(
  props: Props,
  ctx: ResolverContext<WebContext>,
): Promise<VtexProduct[]> {
  return await ctx.invoke("example/loaders/products/list", {
    query: props.query,
    count: props.count ?? 12,
  });
}
