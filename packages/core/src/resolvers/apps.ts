import { instantiateApp, type AppModule } from "../apps/runtime";
import type { ManifestRegistry } from "../manifest/types";
import type { State } from "../state/state";
import type { JsonLike } from "../utils/types";
import type {
  Resolver,
  ResolverContext,
  ResolverId,
  ResolverType,
} from "./types";

export interface AppEntrypointModule {
  default: (state: Record<string, unknown>) => AppModule;
  manifestRegistry: ManifestRegistry;
}

export class AppsResolver<
  TContext extends ResolverContext = ResolverContext,
> implements Resolver<TContext> {
  public static type: ResolverType = "apps";
  private state?: State<TContext>;

  get type(): ResolverType {
    return AppsResolver.type;
  }

  constructor(
    // private readonly state: State<TContext>,
    public id: ResolverId,
    public module: AppEntrypointModule,
  ) {}

  public setState(state: State<TContext>) {
    this.state = state;
    return this;
  }

  public async resolve(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    if (typeof this.module.default !== "function") {
      throw new Error(
        `App resolver "${this.id}" must export a default function.`,
      );
    }

    if (!this.state) {
      throw new Error(
        `App resolver "${this.id}" must be set to a state before resolving.`,
      );
    }

    const appModule = this.module.default(props);
    const instance = await instantiateApp(this.state, appModule, ctx);
    return {
      resolverId: this.id,
      state: instance.state,
      ctx: instance.ctx,
    } as unknown as JsonLike;
  }
}
