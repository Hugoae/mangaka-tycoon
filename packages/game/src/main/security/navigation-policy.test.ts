import { describe, expect, it } from "vitest";

import { allowedOriginsFor, isUrlOfApp, originOf } from "./navigation-policy";

const APP = ["app://game"];

describe("originOf", () => {
  it("rebuilds the origin of a custom scheme", () => {
    expect(originOf("app://game/index.html?x=1")).toBe("app://game");
  });

  it("keeps the port of a web origin", () => {
    expect(originOf("http://localhost:5173/")).toBe("http://localhost:5173");
  });

  it("returns null for something that is not a URL", () => {
    expect(originOf("not a url")).toBeNull();
  });
});

describe("allowedOriginsFor", () => {
  it("only allows the app in production", () => {
    expect(allowedOriginsFor(undefined)).toEqual(APP);
  });

  it("also allows the dev server in development", () => {
    expect(allowedOriginsFor("http://localhost:5173/")).toEqual([...APP, "http://localhost:5173"]);
  });

  it("ignores an unparsable dev server URL instead of allowing it", () => {
    expect(allowedOriginsFor("not a url")).toEqual(APP);
  });
});

describe("isUrlOfApp", () => {
  it("accepts pages of the app", () => {
    expect(isUrlOfApp("app://game/index.html", APP)).toBe(true);
    expect(isUrlOfApp("app://game/other/page.html#x", APP)).toBe(true);
  });

  it.each([
    "https://example.com/",
    "http://localhost:5173/",
    "file:///C:/Windows/win.ini",
    "javascript:alert(1)",
    "app://evil/index.html",
    "data:text/html,<h1>x</h1>",
    "not a url",
    "",
  ])("refuses %j", (url) => {
    expect(isUrlOfApp(url, APP)).toBe(false);
  });

  it("refuses a missing URL", () => {
    expect(isUrlOfApp(undefined, APP)).toBe(false);
  });

  it("accepts the dev server only when it is listed", () => {
    const allowed = [...APP, "http://localhost:5173"];
    expect(isUrlOfApp("http://localhost:5173/", allowed)).toBe(true);
    expect(isUrlOfApp("http://localhost:9999/", allowed)).toBe(false);
  });
});
