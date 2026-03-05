import { loadBlocks } from "../block/load";
import { resolveBlock } from "../block/resolver";
import type { Blocks } from "../block/types";
import { InMemoryCacheStore } from "../cache/in-memory-cache-store";
import type { LoaderCacheStore } from "../cache/types";
import {
  buildManifestRegistryFromRoots,
  writeManifestFilesForRoots,
} from "../manifest/runtime";
import type { AppManifest, ManifestRegistry } from "../manifest/types";
import type { CorePlugin } from "../plugin";
import { hydrateResolversFromManifests } from "../resolvers/registry";
import type {
  EmptyContext,
  ResolverContext,
  ResolverId,
  ResolverInvokeMap,
  ResolverRuntimeContext,
  Resolvers,
} from "../resolvers/types";
import type { JsonLike } from "../utils/types";

export interface StateType<TContext extends ResolverContext = EmptyContext> {
  blocks: Blocks;
  resolvers: Resolvers<TContext>;
}

export interface StateOptions {
  cacheStore?: LoaderCacheStore;
}

export interface StateInitOptions {
  appName: string;
  manifests?: ManifestRegistry | AppManifest[];
  manifestRoots?: string[];
  writeManifestFiles?: boolean;
}

export class State<
  TContext extends ResolverContext = EmptyContext,
  TInvokeMap extends ResolverInvokeMap = ResolverInvokeMap,
> implements StateType<TContext> {
  public blocks: Blocks = new Map();
  public resolvers: Resolvers<TContext> = new Map();
  public appName?: string;
  private readonly cacheStore: LoaderCacheStore;

  constructor(options: StateOptions = {}) {
    this.cacheStore = options.cacheStore ?? new InMemoryCacheStore();
  }

  private async getManifests(
    manifestRoots: string[],
    writeManifestFiles: boolean,
  ) {
    if (writeManifestFiles) {
      await writeManifestFilesForRoots(manifestRoots);
    }
    return await buildManifestRegistryFromRoots(manifestRoots);
  }

  public async init(options: StateInitOptions) {
    this.appName = options.appName;
    this.blocks = await loadBlocks();
    const manifestRoots = options.manifestRoots ?? [process.cwd()];
    const shouldWriteManifestFiles = options.writeManifestFiles ?? true;

    const manifests = options.manifests
      ? options.manifests
      : await this.getManifests(manifestRoots, shouldWriteManifestFiles);

    this.resolvers = await hydrateResolversFromManifests<TContext>(manifests);
  }

  public async use<TAddedContext extends ResolverContext>(
    plugin: CorePlugin<TContext, TAddedContext>,
  ): Promise<State<TContext & TAddedContext, TInvokeMap>> {
    const nextState = this as unknown as State<
      TContext & TAddedContext,
      TInvokeMap
    >;
    await plugin.install(nextState);
    return nextState;
  }

  public async invoke<TResolverId extends keyof TInvokeMap & ResolverId>(
    resolverId: TResolverId,
    props: TInvokeMap[TResolverId]["props"],
    ctx: TContext,
  ): Promise<TInvokeMap[TResolverId]["return"]> {
    const resolved = await this.resolve(
      resolverId as ResolverId,
      props as Record<string, unknown>,
      ctx,
    );
    return resolved as TInvokeMap[TResolverId]["return"];
  }

  public async resolve(
    resolverId: ResolverId,
    props: Record<string, unknown> = {},
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    let runtimeCtx: TContext & ResolverRuntimeContext<TInvokeMap>;
    const runtimeResolve: ResolverRuntimeContext<TInvokeMap>["resolve"] =
      async (nestedResolverId, nestedProps = {}) => {
        return await resolveBlock(
          nestedResolverId,
          nestedProps,
          {
            blocks: this.blocks,
            resolvers: this.resolvers,
          },
          runtimeCtx,
        );
      };
    const runtimeInvoke: ResolverRuntimeContext<TInvokeMap>["invoke"] = async (
      nestedResolverId,
      nestedProps,
    ) => {
      const resolved = await runtimeResolve(
        nestedResolverId as ResolverId,
        nestedProps as Record<string, unknown>,
      );
      return resolved as TInvokeMap[typeof nestedResolverId]["return"];
    };

    runtimeCtx = {
      ...ctx,
      resolve: runtimeResolve,
      invoke: runtimeInvoke,
      cache: this.cacheStore,
    } as TContext & ResolverRuntimeContext<TInvokeMap>;

    return await resolveBlock(
      resolverId,
      props,
      {
        blocks: this.blocks,
        resolvers: this.resolvers,
      },
      runtimeCtx,
    );
  }
}
