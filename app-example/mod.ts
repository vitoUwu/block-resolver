import type { AppModule } from "@block-resolver/core";
import manifest from "./manifest.gen";
import type {
  AppExampleClient,
  AppExampleContext,
  AppExampleRuntime,
} from "./types";

interface ResolvableReference {
  resolverId: string;
  props?: Record<string, unknown>;
}

interface SecretLike {
  get?: () => string | null;
}

export interface State {
  apiBaseUrl: string;
  token: string | SecretLike | ResolvableReference;
}

type Manifest = typeof manifest;
type App = AppModule<Manifest, State, AppExampleContext>;

function isSecretLike(value: unknown): value is SecretLike {
  return !!value && typeof value === "object" && "get" in value;
}

function createHttpClient(baseUrl: string, token: string): AppExampleClient {
  const baseHeaders = {
    authorization: `Bearer ${token}`,
  };

  return {
    get(path, init = {}) {
      return fetch(new URL(path, baseUrl), {
        ...init,
        method: "GET",
        headers: {
          ...baseHeaders,
          ...(init.headers ?? {}),
        },
      });
    },
    post(path, body, init = {}) {
      return fetch(new URL(path, baseUrl), {
        ...init,
        method: "POST",
        headers: {
          ...baseHeaders,
          "content-type": "application/json",
          ...(init.headers ?? {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
  };
}

export default function App(state: State): App {
  return {
    manifest,
    state,
    async init(resolvedState) {
      const token =
        typeof resolvedState.token === "string"
          ? resolvedState.token
          : isSecretLike(resolvedState.token)
            ? (resolvedState.token.get?.() ?? null)
            : null;

      if (typeof token !== "string") {
        console.error(
          "app-example state.token must resolve to a string (or secret-like object with get()).",
        );
      }

      const runtime: AppExampleRuntime = {
        token,
        client: createHttpClient(resolvedState.apiBaseUrl, token ?? ""),
        state: {
          startedAt: new Date().toISOString(),
        },
      };

      return {
        appExample: runtime,
        client: runtime.client,
      };
    },
  };
}
