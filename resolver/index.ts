import { readdirSync } from "fs";
import { join } from "path";
import type { Block } from "../blocks";
import BLOCKS, { getBlock } from "../blocks/blocks";
import { ROOT } from "../constants";

const STATE = new Map<string, Block>();

export async function initState() {
  STATE.clear();

  for (const block of BLOCKS) {
    const dirEntries = readdirSync(join(ROOT, block.type), {
      withFileTypes: true,
    });
    for (const dirEntry of dirEntries) {
      if (!dirEntry.isFile()) continue;
      const blockModule = await import(join(ROOT, block.type, dirEntry.name));
      const blockClass = getBlock(block.type);
      if (!blockClass) {
        throw new Error(`Block class for ${block.type} not found`);
      }
      const blockInstance = new blockClass(dirEntry.name, blockModule);
      STATE.set(blockInstance.resolverId, blockInstance);
    }
  }

  return STATE;
}
