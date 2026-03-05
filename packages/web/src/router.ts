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

function normalizePathname(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
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

function getResolverTypeFromId(resolverId: ResolverId): string | null {
  const [, resolverType] = resolverId.split("/");
  return resolverType ?? null;
}

function isLikelyGlobalBlockId(resolverId: ResolverId): boolean {
  const [appName, resolverType, ...rest] = resolverId.split("/");
  return !!appName && !resolverType && rest.length === 0;
}

function isSectionsResolverRequest<TContext extends ResolverContext>(
  state: State<TContext & WebContext>,
  resolverId: ResolverId,
): boolean {
  const resolverType = getResolverTypeFromId(resolverId);
  if (resolverType === "sections" || resolverType === "pages") {
    return true;
  }

  if (!isLikelyGlobalBlockId(resolverId)) {
    return false;
  }

  const block = state.blocks.get(resolverId);
  if (!block) {
    return false;
  }

  const blockResolverType = getResolverTypeFromId(block.resolverId);
  return blockResolverType === "sections" || blockResolverType === "pages";
}

function getPageBlockIdByPath<TContext extends ResolverContext>(
  state: State<TContext & WebContext>,
  pathname: string,
): ResolverId | null {
  for (const [blockId, block] of state.blocks.entries()) {
    const resolverType = getResolverTypeFromId(block.resolverId);
    if (resolverType !== "pages") {
      continue;
    }

    const blockPath = (block.props as { path?: unknown } | undefined)?.path;
    if (typeof blockPath === "string" && normalizePathname(blockPath) === pathname) {
      return blockId as ResolverId;
    }
  }

  return null;
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
    const pathname = normalizePathname(url.pathname);
    let resolverId: ResolverId;

    if (pathname.startsWith(basePath)) {
      const resolverPath = pathname.slice(basePath.length).replace(/^\/+/, "");
      if (!resolverPath) {
        return new Response("Resolver path is required", { status: 400 });
      }
      resolverId = resolverPath as ResolverId;
    } else {
      const pageBlockId = getPageBlockIdByPath(state, pathname);
      if (!pageBlockId) {
        return new Response("Not Found", { status: 404 });
      }
      resolverId = pageBlockId;
    }

    const shouldReturnHtml = isSectionsResolverRequest(state, resolverId);
    const props = await readProps(request);

    try {
      const resolved = await state.resolve(resolverId, props, {
        ...ctx,
        request,
      } as TContext & WebContext);

      if (shouldReturnHtml && typeof resolved === "string") {
        return new Response(resolved, {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      }

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
