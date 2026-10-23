import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./csp";

function directive(policy: string, name: string): string | undefined {
  return policy.split("; ").find((part) => part.startsWith(`${name} `));
}

describe("buildContentSecurityPolicy (production)", () => {
  const policy = buildContentSecurityPolicy();

  it("denies everything by default", () => {
    expect(directive(policy, "default-src")).toBe("default-src 'none'");
  });

  it("never allows eval or inline script", () => {
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toContain("unsafe-inline");
  });

  it("only runs scripts and connects to its own origin", () => {
    expect(directive(policy, "script-src")).toBe("script-src 'self'");
    expect(directive(policy, "connect-src")).toBe("connect-src 'self'");
  });

  it("forbids plugins, framing, forms and base URL changes", () => {
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(policy, "form-action")).toBe("form-action 'none'");
    expect(directive(policy, "base-uri")).toBe("base-uri 'none'");
  });

  it("mentions no remote origin", () => {
    expect(policy).not.toMatch(/https?:|wss?:|\*/);
  });
});

describe("buildContentSecurityPolicy (dev server)", () => {
  const policy = buildContentSecurityPolicy({ devServerOrigin: "http://localhost:5173" });

  it("lets the page talk to the dev server for hot reload, over http and websocket", () => {
    expect(directive(policy, "connect-src")).toBe(
      "connect-src 'self' http://localhost:5173 ws://localhost:5173",
    );
  });

  it("allows inline script and style, which hot reload needs, but still no eval", () => {
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("keeps every other restriction", () => {
    expect(directive(policy, "default-src")).toBe("default-src 'none'");
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
  });
});
