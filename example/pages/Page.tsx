import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";

interface Props {
  path: string;
  name: string;
  sections: ReactNode[];
}

export default async function Page(props: Props, _req: Request, ctx: any) {
  const stream = await renderToReadableStream(
    <html>
      <body>{props.sections}</body>
    </html>,
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
