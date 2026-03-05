import type {
  ResolverContext,
  ResolverId,
  State,
} from "../../core/src/index";
import type { WebContext } from "./plugin";

export interface InvokeRouterOptions {
  basePath?: string;
}

export interface BunServeFetchOptions<TContext extends ResolverContext>
  extends InvokeRouterOptions {
  getContext?: (
    request: Request,
  ) =>
    | Omit<TContext & WebContext, "request">
    | Promise<Omit<TContext & WebContext, "request">>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeBasePath(basePath: string): string {
  if (!basePath.startsWith("/")) return `/${basePath}`;
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
}

async function readProps(request: Request): Promise<Record<string, unknown>> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const body = await request.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function toResponse(result: unknown): Response {
  if (result instanceof Response) return result;
  return Response.json(result ?? null);
}

export function createInvokeHandler<TContext extends ResolverContext>(
  state: State<TContext & WebContext>,
  options: InvokeRouterOptions = {},
) {
  const basePath = normalizeBasePath(options.basePath ?? "/invoke");

  return async function handleInvoke(
    request: Request,
    ctx: Omit<TContext & WebContext, "request"> = {} as Omit<
      TContext & WebContext,
      "request"
    >,
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;

    if (!pathname.startsWith(basePath)) {
      return new Response("Not Found", { status: 404 });
    }

    const resolverPath = pathname.slice(basePath.length).replace(/^\/+/, "");
    if (!resolverPath) {
      return new Response("Resolver path is required", { status: 400 });
    }

    const resolverId = resolverPath as ResolverId;
    const props = await readProps(request);

    try {
      const resolved = await state.resolve(resolverId, props, {
        ...ctx,
        request,
      } as TContext & WebContext);
      return toResponse(resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Error";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

export function createBunServeFetch<TContext extends ResolverContext>(
  state: State<TContext & WebContext>,
  options: BunServeFetchOptions<TContext> = {},
) {
  const { getContext, ...invokeOptions } = options;
  const invoke = createInvokeHandler<TContext>(state, invokeOptions);

  return async function bunFetch(request: Request): Promise<Response> {
    const ctx = getContext ? await getContext(request) : undefined;
    return invoke(request, ctx);
  };
}
