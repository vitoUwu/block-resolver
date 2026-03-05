import type { ResolverContext } from "../resolvers/types";
import type { State } from "../state/state";
import { isRecord } from "../utils/record";

interface ResolvableReference {
  resolverId: string;
  props?: Record<string, unknown>;
}

export interface AppModule<
  TManifest = unknown,
  TState extends object = Record<string, unknown>,
  TCtx extends object = Record<string, unknown>,
> {
  manifest: TManifest;
  state: TState;
  init?: (state: TState) => Promise<TCtx> | TCtx;
}

export interface AppInstance<
  TManifest = unknown,
  TState extends object = Record<string, unknown>,
  TCtx extends object = Record<string, unknown>,
> {
  manifest: TManifest;
  state: TState;
  ctx: TCtx;
}

function isResolvableReference(value: unknown): value is ResolvableReference {
  return (
    isRecord(value) &&
    typeof value.resolverId === "string" &&
    (value.props === undefined || isRecord(value.props))
  );
}

async function unwrapResolvedValue(value: unknown): Promise<unknown> {
  if (!(value instanceof Response)) {
    return value;
  }

  const contentType = value.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await value.json();
  }

  return await value.text();
}

async function resolveNestedConfig<TContext extends ResolverContext>(
  state: State<TContext>,
  value: unknown,
  ctx: TContext,
): Promise<unknown> {
  if (isResolvableReference(value)) {
    const resolved = await state.resolve(
      value.resolverId,
      value.props ?? {},
      ctx,
    );
    return await unwrapResolvedValue(resolved);
  }

  if (Array.isArray(value)) {
    return await Promise.all(
      value.map(async (item) => await resolveNestedConfig(state, item, ctx)),
    );
  }

  if (!isRecord(value)) {
    return value;
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, entryValue]) => [
      key,
      await resolveNestedConfig(state, entryValue, ctx),
    ]),
  );
  return Object.fromEntries(entries);
}

export async function instantiateApp<
  TContext extends ResolverContext,
  TManifest,
  TState extends object,
  TCtx extends object,
>(
  state: State<TContext>,
  app: AppModule<TManifest, TState, TCtx>,
  ctx: TContext = {} as TContext,
): Promise<AppInstance<TManifest, TState, TCtx>> {
  const resolvedState = (await resolveNestedConfig(
    state,
    app.state,
    ctx,
  )) as TState;
  const appCtx = app.init ? await app.init(resolvedState) : ({} as TCtx);

  return {
    manifest: app.manifest,
    state: resolvedState,
    ctx: appCtx,
  };
}
