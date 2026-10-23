import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { APP_ENTRY_URL, resolveAppRequest } from "./app-url";

const ROOT = resolve("renderer-root");

/**
 * Segment-based on purpose: on POSIX, `..\..\x` is a plain file name inside the root, and a name
 * that merely starts with two dots (`..foo`) is not a parent directory either.
 */
function isInsideRoot(path: string): boolean {
  const fromRoot = relative(ROOT, path);
  return fromRoot.split(sep)[0] !== ".." && !isAbsolute(fromRoot);
}

describe("resolveAppRequest", () => {
  it("serves the entry page for the root and for the entry URL", () => {
    expect(resolveAppRequest("app://game/", ROOT)).toBe(join(ROOT, "index.html"));
    expect(resolveAppRequest(APP_ENTRY_URL, ROOT)).toBe(join(ROOT, "index.html"));
  });

  it("maps a nested path to a file inside the root", () => {
    expect(resolveAppRequest("app://game/assets/index-abc.js", ROOT)).toBe(
      join(ROOT, "assets", "index-abc.js"),
    );
  });

  it("ignores the query string and the fragment", () => {
    expect(resolveAppRequest("app://game/index.html?x=1#section", ROOT)).toBe(
      join(ROOT, "index.html"),
    );
  });

  it("decodes percent-encoded file names", () => {
    expect(resolveAppRequest("app://game/my%20file.png", ROOT)).toBe(join(ROOT, "my file.png"));
  });

  describe("refuses requests that are not for this app", () => {
    it.each([
      ["a foreign host", "app://evil/index.html"],
      ["a foreign scheme", "https://game/index.html"],
      ["the file scheme", "file:///C:/Windows/win.ini"],
      ["something that is not a URL", "not a url"],
      ["an empty string", ""],
    ])("%s", (_label, url) => {
      expect(resolveAppRequest(url, ROOT)).toBeNull();
    });
  });

  describe("never leaves the renderer root", () => {
    it.each([
      ["an encoded slash traversal", "app://game/..%2F..%2Fsecret.txt"],
      ["a deep encoded slash traversal", "app://game/assets/..%2F..%2F..%2Fsecret.txt"],
      ["an encoded backslash traversal", "app://game/..%5C..%5Csecret.txt"],
      ["an encoded dot segment", "app://game/%2e%2e/%2e%2e/secret.txt"],
      ["a plain dot segment", "app://game/../../secret.txt"],
      ["a mixed traversal", "app://game/assets/../../../secret.txt"],
    ])("%s", (_label, url) => {
      const resolved = resolveAppRequest(url, ROOT);
      // Either refused, or confined to the root: never a path outside of it.
      expect(resolved === null || isInsideRoot(resolved)).toBe(true);
    });

    it.each([
      ["an encoded slash traversal", "app://game/..%2F..%2Fsecret.txt"],
      ["a deep encoded slash traversal", "app://game/assets/..%2F..%2F..%2Fsecret.txt"],
    ])("explicitly refuses %s", (_label, url) => {
      expect(resolveAppRequest(url, ROOT)).toBeNull();
    });

    it("refuses a NUL byte", () => {
      expect(resolveAppRequest("app://game/index.html%00.png", ROOT)).toBeNull();
    });

    it("refuses a malformed percent escape", () => {
      expect(resolveAppRequest("app://game/%E0%A4%A", ROOT)).toBeNull();
    });
  });
});
