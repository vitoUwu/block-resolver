import type { AppManifest, ManifestRegistry } from "../manifest/types";
import { ActionsResolver } from "./actions";
import { AppsResolver, type AppEntrypointModule } from "./apps";
import { LoaderResolver } from "./loader";
import { PagesResolver } from "./pages";
import { SectionsResolver } from "./sections";
import type {
  EmptyContext,
  ResolverClass,
  ResolverContext,
  ResolverId,
  Resolvers,
  ResolverType,
} from "./types";

export const resolverClasses: Map<ResolverType, ResolverClass<any>> = new Map([
  [ActionsResolver.type, ActionsResolver as ResolverClass<any>],
  [LoaderResolver.type, LoaderResolver as ResolverClass<any>],
  [PagesResolver.type, PagesResolver as ResolverClass<any>],
  [SectionsResolver.type, SectionsResolver as ResolverClass<any>],
  [AppsResolver.type, AppsResolver as ResolverClass<any>],
]);

export function registerResolver(resolverClass: ResolverClass<any>) {
  if (resolverClasses.has(resolverClass.type)) return;
  resolverClasses.set(resolverClass.type, resolverClass);
}

function normalizeManifests(
  manifests: ManifestRegistry | AppManifest[],
): AppManifest[] {
  if (Array.isArray(manifests)) {
    return manifests;
  }
  return Object.values(manifests);
}

export async function hydrateResolversFromManifests<
  TContext extends ResolverContext = EmptyContext,
>(manifests: ManifestRegistry | AppManifest[]): Promise<Resolvers<TContext>> {
  const resolversMap: Resolvers<TContext> = new Map();
  const appManifests = normalizeManifests(manifests);

  for (const appManifest of appManifests) {
    if (!appManifest.app?.name) {
      throw new Error("Manifest app.name is required.");
    }

    for (const [type, resolverModules] of Object.entries(
      appManifest.resolvers,
    )) {
      const resolverClass = resolverClasses.get(type);
      if (!resolverClass) continue;

      if (!resolversMap.has(type)) {
        resolversMap.set(type, new Map());
      }

      const typedResolverClass = resolverClass as ResolverClass<TContext>;
      const typeMap = resolversMap.get(type)!;

      for (const [resolverId, module] of Object.entries(resolverModules)) {
        if (type === AppsResolver.type) {
          const manifest = module as unknown as AppEntrypointModule;
          const appHydrated = await hydrateResolversFromManifests(
            manifest.manifestRegistry,
          );
          for (const [type, resolverModules] of appHydrated.entries()) {
            if (!resolversMap.has(type)) {
              resolversMap.set(type, new Map());
            }
            const _typeMap = resolversMap.get(type)!;
            for (const [resolverId, resolver] of resolverModules.entries()) {
              _typeMap.set(resolverId, resolver);
            }
          }
        }

        if (!resolverId.startsWith(`${appManifest.app.name}/`)) {
          throw new Error(
            `Resolver id "${resolverId}" must be namespaced with app name "${appManifest.app.name}".`,
          );
        }

        const typedResolverId = resolverId as ResolverId;
        typeMap.set(
          typedResolverId,
          new typedResolverClass(typedResolverId, module),
        );
      }
    }
  }

  return resolversMap;
}
