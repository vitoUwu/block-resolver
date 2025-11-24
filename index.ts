import { writeFile } from "fs/promises";
import { sep } from "path";
import type { Block } from "./blocks";
import { MANIFEST_PATH, ROOT } from "./constants";
import { buildManifest } from "./manifest";
import { initState } from "./resolver";
import { ROUTES } from "./routes";
import { matchPathname } from "./utils/wildcard";

class Context {
  private static instance: Context;
  private state: Map<string, Block>;

  constructor() {
    this.state = new Map();
  }

  public static get() {
    if (!Context.instance) {
      Context.instance = new Context();
    }
    return Context.instance;
  }

  public withState(state: Map<string, Block>) {
    this.state = state;
    return this;
  }

  public resolve(resolverId: string) {
    const block = this.state.get(resolverId);
    if (!block) {
      throw new Error(`Block ${resolverId} not found`);
    }
    return block;
  }
}

async function init() {
  const manifest = await buildManifest(ROOT.split(sep).pop()!);
  await writeFile(MANIFEST_PATH, manifest);

  Context.get().withState(await initState());
}

async function handler(request: Request): Promise<Response> {
  for (const route of ROUTES) {
    const match = matchPathname(request.url, route.path);
    if (match) {
      return await route.handler(request, Context.get());
    }
  }
  return new Response("Not found", { status: 404 });
}

const BlockResolver = {
  init,
  handler,
};

export default BlockResolver;
