export const PATH = "/invoke/**";

async function propsFromRequest(
  request: Request
): Promise<Record<string, any>> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.searchParams.size === 1 && url.searchParams.has("props")) {
      return JSON.parse(url.searchParams.get("props")!) as Record<string, any>;
    }

    const props: Record<string, any> = {};
    for (const [key, value] of url.searchParams.entries()) {
      props[key] = value;
    }
    return props;
  }

  const contentType = request.headers.get("Content-Type");
  if (contentType === "application/json") {
    return (await request.json()) as Record<string, any>;
  }

  throw new Error(`Unsupported content type: ${contentType}`);
}

export async function handler(request: Request, ctx: any): Promise<Response> {
  const resolverId = new URL(request.url).pathname.split("/").pop();

  const block = ctx.resolve(resolverId);

  const props = await propsFromRequest(request);

  const result = await block.execute(props, request, ctx);

  if (result instanceof Response) {
    return result;
  }

  if (typeof result === "object") {
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(result, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
