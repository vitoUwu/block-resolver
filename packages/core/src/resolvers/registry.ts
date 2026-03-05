import { readdir } from "fs/promises";
import { join } from "path";
import { ROOT } from "../constants";
import { LoaderResolver } from "./loader";
import type {
  EmptyContext,
  ResolverContext,
  ResolverClass,
  ResolverId,
  Resolvers,
  ResolverType,
} from "./types";

export const resolverClasses: Map<ResolverType, ResolverClass<any>> = new Map([
  [LoaderResolver.type, LoaderResolver as ResolverClass<any>],
]);

export function registerResolver(resolverClass: ResolverClass<any>) {
  if (resolverClasses.has(resolverClass.type)) return;
  resolverClasses.set(resolverClass.type, resolverClass);
}

export async function loadResolvers<
  TContext extends ResolverContext = EmptyContext,
>(): Promise<Resolvers<TContext>> {
  const resolversMap: Resolvers<TContext> = new Map();

  for (const [type, resolverClass] of resolverClasses.entries()) {
    let files: string[] = [];
    try {
      files = await readdir(join(ROOT, type));
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

      const module = await import(join(ROOT, type, file));
      if (!resolversMap.has(type)) {
        resolversMap.set(type, new Map());
      }

      const resolverId: ResolverId = `app/${type}/${file
        .replace(".ts", "")
        .replace(".js", "")}`;
      const typedResolverClass = resolverClass as ResolverClass<TContext>;
      resolversMap
        .get(type)!
        .set(resolverId, new typedResolverClass(resolverId, module));
    }
  }

  return resolversMap;
}
