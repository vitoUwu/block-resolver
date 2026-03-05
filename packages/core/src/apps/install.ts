import { readdir, readFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { pathToFileURL } from "url";
import { AppsResolver, type AppEntrypointModule } from "../resolvers/apps";
import type { ResolverContext, ResolverId } from "../resolvers/types";
import type { State } from "../state/state";
import { isRecord } from "../utils/record";

const APP_CONFIG_FILE = "block-resolver.app.json";
const APP_ENTRYPOINT_FILE = "mod.ts";
const VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

interface ProjectAppConfig {
  name: string;
  apps?: string[];
}

interface AppConfigLocation {
  root: string;
  configPath: string;
  config: ProjectAppConfig;
}

interface InstalledAppRuntime {
  resolverId: ResolverId;
  state?: unknown;
  ctx: Record<string, unknown>;
}

export interface InstallConfiguredAppsOptions<
  TContext extends ResolverContext = ResolverContext,
> {
  manifestRoots?: string[];
  siteAppName?: string;
  baseContext?: TContext;
  appEntrypointFile?: string;
}

export interface InstallConfiguredAppsResult {
  apps: Record<string, InstalledAppRuntime>;
  ctx: Record<string, unknown>;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function stripExtension(filePath: string): string {
  return filePath.replace(/\.(tsx?|jsx?)$/, "");
}

async function walkDirs(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const absolute = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDirs(absolute)));
      continue;
    }
    files.push(absolute);
  }

  return files;
}

async function discoverAppConfigs(
  roots: string[],
): Promise<AppConfigLocation[]> {
  const configs: AppConfigLocation[] = [];

  for (const root of roots) {
    const files = await walkDirs(root);
    const appConfigFiles = files.filter((file) =>
      file.endsWith(APP_CONFIG_FILE),
    );
    for (const configPath of appConfigFiles) {
      const raw = await readFile(configPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ProjectAppConfig>;
      if (!parsed.name || typeof parsed.name !== "string") {
        throw new Error(
          `App config "${configPath}" must contain string "name".`,
        );
      }

      configs.push({
        root: dirname(configPath),
        configPath,
        config: {
          name: parsed.name,
          apps: Array.isArray(parsed.apps)
            ? parsed.apps.filter(
                (item): item is string => typeof item === "string",
              )
            : [],
        },
      });
    }
  }

  return configs;
}

function indexByAppName(
  configs: AppConfigLocation[],
): Map<string, AppConfigLocation> {
  const byName = new Map<string, AppConfigLocation>();
  for (const config of configs) {
    if (byName.has(config.config.name)) {
      throw new Error(
        `Duplicate app config for "${config.config.name}" found at "${config.configPath}".`,
      );
    }
    byName.set(config.config.name, config);
  }
  return byName;
}

async function getAppEntrypoints(appsRoot: string): Promise<string[]> {
  try {
    const files = await walkDirs(appsRoot);
    return files.filter((file) =>
      VALID_EXTENSIONS.some((extension) => file.endsWith(extension)),
    );
  } catch {
    return [];
  }
}

async function registerAppResolvers<TContext extends ResolverContext>(
  state: State<TContext>,
  siteRoot: string,
  appEntrypointFile: string,
) {
  const appResolverMap =
    state.resolvers.get(AppsResolver.type) ??
    new Map<ResolverId, AppsResolver<TContext>>();
  state.resolvers.set(AppsResolver.type, appResolverMap);

  const appsRoot = join(siteRoot, "apps");
  const appEntrypoints = await getAppEntrypoints(appsRoot);
  for (const entrypoint of appEntrypoints) {
    const relativeFile = normalizePath(relative(appsRoot, entrypoint));
    const normalizedFile = stripExtension(relativeFile);
    const resolverId = `core/apps/${normalizedFile}` as ResolverId;
    if (
      !entrypoint.endsWith(appEntrypointFile) &&
      normalizedFile.includes("/")
    ) {
      // Keep nested entries, but skip accidental non-app helper files
      // unless they follow "<app-name>/mod.ts" convention.
      continue;
    }

    const module = await import(pathToFileURL(entrypoint).href);
    appResolverMap.set(
      resolverId,
      new AppsResolver<TContext>(
        // state,
        resolverId,
        module as AppEntrypointModule,
      ).setState(state),
    );
  }
}

export async function installConfiguredApps<TContext extends ResolverContext>(
  state: State<TContext>,
  options: InstallConfiguredAppsOptions<TContext> = {},
): Promise<InstallConfiguredAppsResult> {
  const manifestRoots = options.manifestRoots ?? [process.cwd()];
  const siteAppName = options.siteAppName ?? state.appName;
  if (!siteAppName) {
    throw new Error(
      "siteAppName is required. Pass options.siteAppName or initialize State with appName.",
    );
  }

  const discoveredConfigs = await discoverAppConfigs(manifestRoots);
  const byName = indexByAppName(discoveredConfigs);
  const siteConfig = byName.get(siteAppName);
  if (!siteConfig) {
    throw new Error(`Could not find site app config for "${siteAppName}".`);
  }

  await registerAppResolvers(
    state,
    siteConfig.root,
    options.appEntrypointFile ?? APP_ENTRYPOINT_FILE,
  );

  const installedBlocks = siteConfig.config.apps ?? [];
  const instances: Record<string, InstalledAppRuntime> = {};
  let mergedContext: Record<string, unknown> = {
    ...(options.baseContext as Record<string, unknown> | undefined),
  };

  for (const blockId of installedBlocks) {
    const appStartAt = performance.now();
    const result = await state.resolve(
      blockId as ResolverId,
      {},
      mergedContext as TContext,
    );
    if (!isRecord(result) || !isRecord(result.ctx)) {
      throw new Error(
        `Installed app block "${blockId}" must resolve to object with "ctx".`,
      );
    }

    const resolverId = String(result.resolverId ?? "") as ResolverId;
    const runtime: InstalledAppRuntime = {
      resolverId,
      state: result.state,
      ctx: result.ctx,
    };
    const appDurationMs = performance.now() - appStartAt;
    console.log(
      `[apps] instantiated "${blockId}" (${resolverId}) in ${appDurationMs.toFixed(2)}ms`,
    );

    instances[blockId] = runtime;
    mergedContext = {
      ...mergedContext,
      ...runtime.ctx,
    };
  }

  return {
    apps: instances,
    ctx: mergedContext,
  };
}
