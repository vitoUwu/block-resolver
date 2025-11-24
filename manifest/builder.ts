import { isObject } from "../utils/isObject";

export class ManifestBuilder {
  private blocks: Record<
    string,
    Record<string, { importName: string; key: string }>
  > = {};
  private importId = 0;
  private imports: string[] = [];

  constructor(private readonly appName: string) {}

  public addImport(importPath: string) {
    this.imports.push(`import * as $${this.importId} from "${importPath}";`);
    this.importId++;
    return `$${this.importId - 1}`;
  }

  public addBlock(type: string, name: string) {
    const importName = this.addImport(`./${type}/${name}`);
    this.blocks[type] = this.blocks[type] || {};
    this.blocks[type][name] = {
      importName,
      key: `${this.appName}/${type}/${name}`,
    };
  }

  private stringifyObj(obj: Record<string, any>): string {
    const keyNeedsEscape = (key: string) =>
      ["/", "\\", ".", "$", "[", "]"].some((char) => key.includes(char));
    const innerStringifyObj = (obj: Record<string, any>, level = 1): string => {
      let innerStringified = "";
      for (const [key, value] of Object.entries(obj)) {
        let escapedKey = key;
        if (keyNeedsEscape(key)) {
          escapedKey = `"${key}"`;
        }

        const indent = " ".repeat(level * 2);

        if (typeof value === "string" && /^\$\d+$/.test(value)) {
          innerStringified += `${indent}${escapedKey}: ${value},\n`;
          continue;
        } else if (isObject(value)) {
          innerStringified += `${indent}${escapedKey}: {\n${innerStringifyObj(
            value,
            level + 1
          )}${indent}},\n`;
          continue;
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          innerStringified += `${indent}${escapedKey}: "${value}",\n`;
          continue;
        }
      }

      return innerStringified;
    };

    return `{\n${innerStringifyObj(obj).trimEnd()}\n}`;
  }

  public build(): string {
    const manifestObject: Record<string, Record<string, any>> = {
      app: {
        name: this.appName,
      },
    };

    for (const [type, blocks] of Object.entries(this.blocks)) {
      manifestObject[type] = {};
      for (const { importName, key } of Object.values(blocks)) {
        manifestObject[type][key] = importName;
      }
    }

    let manifestFile = "";
    manifestFile += `// Auto generated manifest for ${this.appName}`;
    for (const importLine of this.imports) {
      manifestFile += `\n${importLine}`;
    }
    manifestFile += `\n\nconst manifest = ${this.stringifyObj(manifestObject)}`;
    manifestFile += `\n\nexport type Manifest = typeof manifest;`;
    manifestFile += `\nexport default manifest;`;

    return manifestFile;
  }
}
