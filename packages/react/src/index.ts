import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import type {
  CorePlugin,
  EmptyContext,
  ResolverContext,
} from "../../core/src/index";
import { registerSectionRenderer } from "../../core/src/index";

export interface ReactPluginOptions {
  rendererId?: string;
}

export function reactSectionsPlugin<
  TBaseContext extends ResolverContext = EmptyContext,
>(
  options: ReactPluginOptions = {},
): CorePlugin<TBaseContext, EmptyContext> {
  const rendererId = options.rendererId ?? "react";

  return {
    name: "react-sections",
    install() {
      registerSectionRenderer(rendererId, ({ component, props, ctx }) => {
        const ReactComponent = component as ComponentType<Record<string, unknown>>;
        const element = createElement(ReactComponent, {
          ...props,
          ctx,
        });
        return renderToString(element);
      });
    },
  };
}
