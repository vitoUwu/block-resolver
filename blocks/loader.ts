import { Block, type BlockInterface, type BlockModule } from ".";
import { isObject } from "../utils/isObject";

interface CacheConfig {
  key: (props: any, request: Request, context: any) => string;
  ttl: number;
  type: "stale-while-revalidate" | "no-cache" | "no-store";
}

interface LoaderBlockInterface extends BlockInterface {
  cache: CacheConfig;
}

const CACHE = new Map<string, { data: any; expiresAt: number }>();

export class LoaderBlock extends Block implements LoaderBlockInterface {
  // By default, the loaders are not cached. Still need to think if we want to cache them by default.
  public cache: CacheConfig = {
    key: () => "",
    ttl: 0,
    type: "no-cache",
  };

  public static override readonly type = "loaders";

  public constructor(
    resolverId: string,
    module: BlockModule<{ cache?: CacheConfig }>
  ) {
    super(resolverId, LoaderBlock.type, module);

    if (module.cache) {
      if (
        !isObject(module.cache) ||
        typeof module.cache.key !== "function" ||
        typeof module.cache.ttl !== "number" ||
        typeof module.cache.type !== "string"
      ) {
        console.warn(
          `Invalid cache configuration for ${this.resolverId} loader block. Defaulting to no-cache.`
        );
      } else {
        this.cache = module.cache;
      }
    }
  }

  public override async execute(props: any, req: Request, ctx: any) {
    if (this.cache.type === "stale-while-revalidate") {
      const key = this.cache.key(props, req, ctx);
      // Implement a proper cache instead of using in memory maps.
      const cached = CACHE.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    const data = await this.module.default(props, req, ctx);

    if (this.cache.type === "stale-while-revalidate") {
      const key = this.cache.key(props, req, ctx);
      CACHE.set(key, { data, expiresAt: Date.now() + this.cache.ttl });
    }

    return data;
  }
}
