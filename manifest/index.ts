import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import BLOCKS from "../blocks/blocks";
import { MANIFEST_PATH, ROOT } from "../constants";
import { ManifestBuilder } from "./builder";

export async function buildManifest(appName: string): Promise<string> {
  const builder = new ManifestBuilder(appName);

  for (const block of BLOCKS) {
    const dirEntries = await readdir(join(ROOT, block.type), {
      withFileTypes: true,
    });
    for (const dirEntry of dirEntries) {
      if (!dirEntry.isFile()) continue;
      builder.addBlock(block.type, dirEntry.name);
    }
  }

  return builder.build();
}

export async function getManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return {};
  }

  const manifest = await import(MANIFEST_PATH);
  return manifest.default;
}
