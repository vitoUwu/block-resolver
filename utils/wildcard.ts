export interface PathMatchOptions {
  /**
   * Whether the match should be case-sensitive.
   * @default false
   */
  caseSensitive?: boolean;
  /**
   * If false, the matcher will allow prefix matches instead of exact matches.
   * @default true
   */
  exact?: boolean;
  /**
   * When true, trailing slashes are considered during normalization.
   * @default false
   */
  strictTrailingSlash?: boolean;
}

export interface PathMatchResult {
  pattern: string;
  params: Record<string, string>;
}

export interface PathMatcher {
  pattern: string;
  normalizedPattern: string;
  options: Required<PathMatchOptions>;
  regex: RegExp;
  test: (pathname: string) => boolean;
  exec: (pathname: string) => PathMatchResult | null;
}

const DEFAULT_OPTIONS: Required<PathMatchOptions> = {
  caseSensitive: false,
  exact: true,
  strictTrailingSlash: false,
};

const REGEX_ESCAPE_RE = /[\\^$.*+?()[\]{}|]/g;

const enum CHAR_CODE {
  ZERO = 48,
  NINE = 57,
  A = 65,
  Z = 90,
  a = 97,
  z = 122,
  UNDERSCORE = 95,
}

function escapeRegexChar(char: string) {
  return char.replace(REGEX_ESCAPE_RE, "\\$&");
}

function isIdentifierStart(code: number) {
  return (
    code === CHAR_CODE.UNDERSCORE ||
    (code >= CHAR_CODE.A && code <= CHAR_CODE.Z) ||
    (code >= CHAR_CODE.a && code <= CHAR_CODE.z)
  );
}

function isIdentifierPart(code: number) {
  return (
    isIdentifierStart(code) ||
    (code >= CHAR_CODE.ZERO && code <= CHAR_CODE.NINE)
  );
}

function readParamName(source: string, start: number) {
  if (start >= source.length) {
    return { name: null as string | null, end: start };
  }

  const first = source.charCodeAt(start);
  if (!isIdentifierStart(first)) {
    return { name: null as string | null, end: start };
  }

  let end = start + 1;
  while (end < source.length && isIdentifierPart(source.charCodeAt(end))) {
    end++;
  }

  return { name: source.slice(start, end), end };
}

function isValidIdentifier(candidate: string) {
  if (!candidate.length) return false;
  const first = candidate.charCodeAt(0);
  if (!isIdentifierStart(first)) return false;
  for (let i = 1; i < candidate.length; i++) {
    if (!isIdentifierPart(candidate.charCodeAt(i))) return false;
  }
  return true;
}

function normalizePathnameInput(
  pathname: string,
  strictTrailingSlash: boolean
) {
  if (!pathname) return "/";
  let normalized = pathname.trim();
  if (!normalized) return "/";

  if (normalized.includes("://")) {
    try {
      normalized = new URL(normalized).pathname || "/";
    } catch {
      // ignore invalid URL parsing
    }
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (!strictTrailingSlash && normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function normalizePatternInput(pattern: string, strictTrailingSlash: boolean) {
  if (!pattern) return "/";
  let normalized = pattern.trim();
  if (!normalized) return "/";

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (!strictTrailingSlash && normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function compilePattern(pattern: string, options: Required<PathMatchOptions>) {
  let source = "";
  const paramNames: string[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (typeof char !== "string") {
      throw new Error(`Invalid character in pattern: ${char}`);
    }

    if (char === "*") {
      if (pattern[i + 1] === "*") {
        source += ".*";
        i++;
      } else {
        source += "[^\\/]*";
      }
      continue;
    }

    if (char === "?") {
      source += "[^\\/]";
      continue;
    }

    if (char === ":") {
      const { name, end } = readParamName(pattern, i + 1);
      if (name) {
        paramNames.push(name);
        source += `(?<${name}>[^\\/]+)`;
        i = end - 1;
        continue;
      }
    }

    if (char === "{") {
      const closing = pattern.indexOf("}", i + 1);
      if (closing > i + 1) {
        const candidate = pattern.slice(i + 1, closing).trim();
        if (isValidIdentifier(candidate)) {
          paramNames.push(candidate);
          source += `(?<${candidate}>[^\\/]+)`;
          i = closing;
          continue;
        }
      }
      source += "\\{";
      continue;
    }

    if (char === "\\") {
      const next = pattern[i + 1];
      if (next) {
        source += escapeRegexChar(next);
        i++;
      } else {
        source += "\\\\";
      }
      continue;
    }

    source += escapeRegexChar(char);
  }

  const suffix = options.exact ? "$" : "(?=$|\\/)";
  const flags = options.caseSensitive ? "" : "i";

  return {
    regex: new RegExp(`^${source}${suffix}`, flags),
    paramNames,
  };
}

function extractParams(paramNames: string[], match: RegExpExecArray) {
  if (!paramNames.length) return {};

  const params: Record<string, string> = {};

  if (match.groups) {
    for (const name of paramNames) {
      if (match.groups[name] !== undefined) {
        params[name] = match.groups[name];
      }
    }
    return params;
  }

  let index = 1;
  for (const name of paramNames) {
    params[name] = match[index++] || "";
  }

  return params;
}

export function createPathMatcher(
  pattern: string,
  options: PathMatchOptions = {}
): PathMatcher {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const normalizedPattern = normalizePatternInput(
    pattern,
    resolvedOptions.strictTrailingSlash
  );
  const compiled = compilePattern(normalizedPattern, resolvedOptions);

  const exec = (pathname: string): PathMatchResult | null => {
    const normalizedPath = normalizePathnameInput(
      pathname,
      resolvedOptions.strictTrailingSlash
    );
    const match = compiled.regex.exec(normalizedPath);
    if (!match) return null;

    return {
      pattern,
      params: extractParams(compiled.paramNames, match),
    };
  };

  const test = (pathname: string) => exec(pathname) !== null;

  return {
    pattern,
    normalizedPattern,
    options: resolvedOptions,
    regex: compiled.regex,
    exec,
    test,
  };
}

export function matchPathname(
  pathname: string | URL,
  pattern: string | string[],
  options?: PathMatchOptions
): PathMatchResult | null {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];

  const normalizedPathname =
    typeof pathname === "string"
      ? new URL(pathname, "http://localhost").pathname
      : pathname.pathname;
  for (const currentPattern of patterns) {
    const matcher = createPathMatcher(currentPattern, options);
    const result = matcher.exec(normalizedPathname);
    if (result) {
      return result;
    }
  }

  return null;
}
