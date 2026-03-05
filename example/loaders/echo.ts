interface Props {
  message: string;
}

interface EchoCtx {
  request?: Request;
}

export default function echo(props: Props, ctx: EchoCtx) {
  return {
    message: props.message,
    requestPath: ctx.request ? new URL(ctx.request.url).pathname : null,
  };
}
