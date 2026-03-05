import type { ResolverContext } from "../resolvers/types";
import type { SectionRenderer, SectionRendererId } from "./types";

const sectionRenderers = new Map<SectionRendererId, SectionRenderer<any>>();

export function registerSectionRenderer<TContext extends ResolverContext>(
  id: SectionRendererId,
  renderer: SectionRenderer<TContext>,
) {
  if (sectionRenderers.has(id)) return;
  sectionRenderers.set(id, renderer as SectionRenderer<any>);
}

export function getSectionRenderer<TContext extends ResolverContext>(
  id: SectionRendererId,
): SectionRenderer<TContext> | undefined {
  const renderer = sectionRenderers.get(id);
  return renderer as SectionRenderer<TContext> | undefined;
}
