/** Compile-time proof that a `switch` handles every member of a union. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
