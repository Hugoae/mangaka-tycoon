import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { callEndpoint, createValidatedHandler, defineEndpoint } from "./ipc";

const echo = defineEndpoint(
  "test:echo",
  z.strictObject({ text: z.string() }),
  z.strictObject({ length: z.number() }),
);

const counter = defineEndpoint("test:counter", z.undefined(), z.number());

describe("createValidatedHandler", () => {
  it("passes a validated request and the context to the implementation", async () => {
    const implementation = vi.fn((request: { text: string }, context: string) => ({
      length: request.text.length + context.length,
    }));
    const handler = createValidatedHandler(echo, implementation);

    await expect(handler({ text: "abc" }, "xy")).resolves.toEqual({ length: 5 });
    expect(implementation).toHaveBeenCalledWith({ text: "abc" }, "xy");
  });

  it.each([
    ["a wrong type", { text: 42 }],
    ["a missing field", {}],
    ["an unexpected field", { text: "a", extra: true }],
    ["no payload", undefined],
    ["a primitive", "text"],
  ])("rejects %s without calling the implementation", async (_label, payload) => {
    const implementation = vi.fn(() => ({ length: 0 }));
    const handler = createValidatedHandler(echo, implementation);

    await expect(handler(payload, undefined)).rejects.toThrow();
    expect(implementation).not.toHaveBeenCalled();
  });

  it("refuses an implementation that returns an invalid response", async () => {
    // zod refuses NaN for a number: a value that type-checks but breaks the contract.
    const handler = createValidatedHandler(counter, () => Number.NaN);
    await expect(handler(undefined, undefined)).rejects.toThrow();
  });
});

describe("callEndpoint", () => {
  it("sends the validated request and returns the validated response", async () => {
    const invoke = vi.fn(() => Promise.resolve({ length: 3 }));

    await expect(callEndpoint(invoke, echo, { text: "abc" })).resolves.toEqual({ length: 3 });
    expect(invoke).toHaveBeenCalledWith("test:echo", { text: "abc" });
  });

  it("does not send an invalid request", async () => {
    const invoke = vi.fn(() => Promise.resolve({ length: 0 }));

    // @ts-expect-error -- a request that the type system would normally reject
    await expect(callEndpoint(invoke, echo, { text: 1 })).rejects.toThrow();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("rejects a response that does not match the schema", async () => {
    const invoke = vi.fn(() => Promise.resolve({ length: "three" }));
    await expect(callEndpoint(invoke, echo, { text: "abc" })).rejects.toThrow();
  });
});
