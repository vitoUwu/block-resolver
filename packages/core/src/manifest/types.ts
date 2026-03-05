export type ManifestResolverModule = {
  default: (...args: any[]) => unknown;
  [key: string]: unknown;
};

export type ManifestResolversByType = Record<
  string,
  Record<string, ManifestResolverModule>
>;

export interface AppManifest<TAppName extends string = string> {
  app: {
    name: TAppName;
  };
  resolvers: ManifestResolversByType;
}

export type ManifestRegistry = Record<string, AppManifest>;
