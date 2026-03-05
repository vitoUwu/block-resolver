export interface AppExampleClient {
  get: (path: string, init?: RequestInit) => Promise<Response>;
  post: (
    path: string,
    body?: unknown,
    init?: Omit<RequestInit, "body" | "method">,
  ) => Promise<Response>;
}

export interface AppExampleRuntimeState {
  startedAt: string;
}

export interface AppExampleRuntime {
  token: string | null;
  client: AppExampleClient;
  state: AppExampleRuntimeState;
}

export interface AppExampleContext {
  appExample: AppExampleRuntime;
  client: AppExampleClient;
}
