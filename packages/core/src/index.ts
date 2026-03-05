import type { LoaderCacheStore } from "./cache/types";
import type { AppManifest, ManifestRegistry } from "./manifest/types";
import type { EmptyContext, ResolverInvokeMap } from "./resolvers/types";
import { State } from "./state/state";

export interface InitOptions {
  appName: string;
  manifests?: ManifestRegistry | AppManifest[];
  manifestRoots?: string[];
  writeManifestFiles?: boolean;
  cacheStore?: LoaderCacheStore;
}

export async function init<
  TInvokeMap extends ResolverInvokeMap = ResolverInvokeMap,
>(options: InitOptions) {
  const state = new State<EmptyContext, TInvokeMap>(options);
  await state.init(options);
  return state;
}

export { installConfiguredApps } from "./apps/install";
export type {
  InstallConfiguredAppsOptions,
  InstallConfiguredAppsResult,
} from "./apps/install";
export { instantiateApp } from "./apps/runtime";
export type { AppInstance, AppModule } from "./apps/runtime";
export type { Block, Blocks } from "./block/types";
export { InMemoryCacheStore } from "./cache/in-memory-cache-store";
export type {
  CacheRecord,
  LoaderCacheConfig,
  LoaderCacheStore,
  LoaderCacheType,
} from "./cache/types";
export {
  buildManifestRegistryFromRoots,
  writeManifestFilesForRoots,
} from "./manifest/runtime";
export type { AppManifest, ManifestRegistry } from "./manifest/types";
export type { CorePlugin } from "./plugin";
export { ActionsResolver } from "./resolvers/actions";
export { AppsResolver } from "./resolvers/apps";
export { LoaderResolver } from "./resolvers/loader";
export { PagesResolver } from "./resolvers/pages";
export { registerResolver } from "./resolvers/registry";
export { SectionsResolver } from "./resolvers/sections";
export type {
  EmptyContext,
  Resolver,
  ResolverClass,
  ResolverContext,
  ResolverId,
  ResolverInvokeMap,
  ResolverRuntimeContext,
  Resolvers,
  ResolverType,
} from "./resolvers/types";
export {
  getSectionRenderer,
  registerSectionRenderer,
} from "./sections/registry";
export type {
  SectionModule,
  SectionRenderer,
  SectionRendererId,
  SectionRenderInput,
  SectionsResolverContext,
} from "./sections/types";
export { State } from "./state/state";
export type { StateInitOptions, StateOptions } from "./state/state";
export type { JsonLike } from "./utils/types";
