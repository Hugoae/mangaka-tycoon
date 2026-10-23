import { CONTENT_FILE_NAMES } from "@mangaka/content";
import { describe, expect, it } from "vitest";

import { loadContent } from "./load-content";

const ok = (text: string) =>
  Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(text) });

describe("loadContent", () => {
  it("asks for every content file under the base url", async () => {
    const requested: string[] = [];

    await loadContent("/data/", (url) => {
      requested.push(url);
      return ok("{}");
    });

    expect(requested.toSorted()).toEqual(
      CONTENT_FILE_NAMES.map((name) => `/data/${name}`).toSorted(),
    );
  });

  it("reports the validation problems of files that were read", async () => {
    const result = await loadContent("/data/", () => ok("{}"));

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.length).toBeGreaterThan(0);
  });

  it("reports a file the server does not have", async () => {
    const result = await loadContent("/data/", () =>
      Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("") }),
    );

    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? [] : result.errors).toContain(
      "balance.jsonc: could not be read (HTTP 404).",
    );
  });

  it("reports a network failure instead of throwing", async () => {
    const result = await loadContent("/data/", () => Promise.reject(new Error("offline")));

    expect(result.ok ? [] : result.errors).toContain("balance.jsonc: could not be read (offline).");
  });

  it("reports a failure that is not an Error", async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- anything can be thrown in JavaScript: this is exactly the case under test
    const result = await loadContent("/data/", () => Promise.reject("boom"));

    expect(result.ok ? [] : result.errors).toContain(
      "balance.jsonc: could not be read (unknown error).",
    );
  });
});
