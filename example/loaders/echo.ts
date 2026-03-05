import type { WebContext } from "@block-resolver/web";

interface Props {
  message: string;
}

export default function echo(props: Props, ctx: WebContext) {
  return {
    message: props.message,
    requestPath: new URL(ctx.request.url).pathname,
  };
}
