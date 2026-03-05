import { readdir } from "fs/promises";
import { join } from "path";
import { ROOT } from "../constants";
import { LoaderResolver } from "./loader";
import type {
  ResolverClass,
  ResolverId,
  Resolvers,
  ResolverType,
} from "./types";

export const resolverClasses: Map<ResolverType, ResolverClass> = new Map([
  [LoaderResolver.type, LoaderResolver],
]);

export function registerResolver(resolverClass: ResolverClass) {
  if (resolverClasses.has(resolverClass.type)) return;
  resolverClasses.set(resolverClass.type, resolverClass);
}

export async function loadResolvers(): Promise<Resolvers> {
  const resolversMap: Resolvers = new Map();

  for (const [type, ResolverClass] of resolverClasses.entries()) {
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
      resolversMap.get(type)!.set(resolverId, new ResolverClass(resolverId, module));
    }
  }

  return resolversMap;
}
