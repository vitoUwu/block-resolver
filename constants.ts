import { join } from "path";

export const ROOT = process.cwd();
export const BLOCKS_FOLDER_PATH = join(ROOT, ".blocks");
export const MANIFEST_PATH = join(ROOT, "manifest.gen.ts");
