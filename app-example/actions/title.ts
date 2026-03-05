import type { AppExampleContext } from "../types";

interface Props {
  value: string;
}

export default function appExampleTitleAction(
  props: Props,
  ctx: AppExampleContext,
) {
  return `${props.value} (${ctx.appExample.token?.slice(0, 8)}...)`;
}
