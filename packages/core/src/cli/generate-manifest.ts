#!/usr/bin/env bun
import { resolve } from "path";
import { writeManifestFilesForRoots } from "../manifest/runtime";

async function main() {
  const args = process.argv.slice(2);
  const roots = args.length > 0 ? args.map((root) => resolve(process.cwd(), root)) : [process.cwd()];

  await writeManifestFilesForRoots(roots);
  console.log(`Manifest files generated for ${roots.length} root(s).`);
}

await main();
