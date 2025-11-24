import { handler as invokeHandler, PATH as INVOKE_PATH } from "./invoke";

export const ROUTES = [
  {
    path: INVOKE_PATH,
    handler: invokeHandler,
  },
];
