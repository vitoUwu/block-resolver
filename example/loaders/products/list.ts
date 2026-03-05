import type { LoaderCacheConfig } from "@block-resolver/core";

export interface VtexProduct {
  productId: string;
  productName: string;
  brand: string;
  productTitle: string;
  items: {
    itemId: string;
    name: string;
    nameComplete: string;
    images: {
      imageId: string;
      imageUrl: string;
      imageLabel: string;
    }[];
  }[];
}

interface Props {
  query: string;
  count?: number;
}

export default async function productsList(props: Props) {
  const fq = props.query;
  const _from = 0;
  const _to = props.count || 12;

  const url = new URL(
    "https://alssports.vtexcommercestable.com.br/api/catalog_system/pub/products/search/",
  );
  url.searchParams.set("fq", fq);
  url.searchParams.set("_from", _from.toString());
  url.searchParams.set("_to", _to.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data as VtexProduct[];
}

export const cache: LoaderCacheConfig<Props> = {
  type: "stale-while-revalidate",
  ttl: 15_000,
  key: (props) => `products:list:${props.query}:${props.count || 12}`,
};
