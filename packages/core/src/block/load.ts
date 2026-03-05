import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { BLOCKS_FOLDER_PATH } from "../constants";
import type { Block, Blocks } from "./types";

export async function loadBlocks(): Promise<Blocks> {
  const blocks: Blocks = new Map();

  let files: string[] = [];
  try {
    files = await readdir(BLOCKS_FOLDER_PATH);
  } catch {
    return blocks;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const block: Block = JSON.parse(
      readFileSync(join(BLOCKS_FOLDER_PATH, file), "utf8"),
    );
    blocks.set(file.replace(".json", ""), block);
  }

  return blocks;
}
