import { LoaderBlock } from "./loader";

const BLOCKS = [LoaderBlock] as const;

export function getBlock(type: string) {
  return BLOCKS.find((block) => block.type === type);
}

export default BLOCKS;
