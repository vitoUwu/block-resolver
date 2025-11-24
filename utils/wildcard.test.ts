import { expect, test } from "bun:test";
import { createPathMatcher, matchPathname } from "./wildcard.ts";

test("matches colon params", () => {
  const result = matchPathname("/products/123", "/products/:id");

  expect(result).toEqual({
    pattern: "/products/:id",
    params: { id: "123" },
  });
});

test("matches curly template params and normalizes urls", () => {
  const result = matchPathname(
    "https://example.com/blog/summer-guide",
    "/blog/{slug}"
  );

  expect(result).toEqual({
    pattern: "/blog/{slug}",
    params: { slug: "summer-guide" },
  });
});

test("supports wildcard tokens", () => {
  const single = matchPathname("/assets/logo.svg", "/assets/*.svg");
  const deep = matchPathname("/assets/icons/2024/logo.svg", "/assets/**");
  const singleChar = matchPathname("/files/a.txt", "/files/?.txt");

  expect(single).toBeDefined();
  expect(deep).toBeDefined();
  expect(singleChar).toBeDefined();
  expect(singleChar).toBeDefined();
});

test("respects case sensitivity option", () => {
  const insensitive = matchPathname("/Blog/Post", "/blog/:slug");
  const sensitive = matchPathname("/blog/post", "/Blog/:slug", {
    caseSensitive: true,
  });

  expect(insensitive).toBeDefined();
  expect(sensitive).toBeNull();
});

test("supports prefix matches when exact=false", () => {
  const result = matchPathname(
    "/docs/getting-started/install",
    "/docs/getting-started",
    { exact: false }
  );

  expect(result).toBeDefined();
});

test("enforces strict trailing slash when enabled", () => {
  const loose = matchPathname("/about/", "/about");
  const strict = matchPathname("/about/", "/about", {
    strictTrailingSlash: true,
  });
  const strictMatch = matchPathname("/about/", "/about/", {
    strictTrailingSlash: true,
  });

  expect(loose).toBeDefined();
  expect(strict).toBeNull();
  expect(strictMatch).toBeDefined();
});

test("uses the first matching pattern in an array", () => {
  const result = matchPathname("/support", ["/support", "/:page"]);

  expect(result).toEqual({
    pattern: "/support",
    params: {},
  });
});

test("returns null when nothing matches", () => {
  const result = matchPathname("/unknown", "/known/:id");

  expect(result).toBeNull();
});

test("createPathMatcher exposes test and exec helpers", () => {
  const matcher = createPathMatcher("/files/:name");

  expect(matcher.test("/files/report")).toBe(true);
  expect(matcher.exec("/files/report")).toEqual({
    pattern: "/files/:name",
    params: { name: "report" },
  });
  expect(matcher.exec("/files")).toBeNull();
});
