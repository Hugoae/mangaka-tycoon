import type { z } from "zod";

/**
 * One typed IPC channel: its name and the schemas of what crosses it in both directions.
 * Both sides validate (ADR 0008): data coming from the other process is never trusted.
 */
export interface IpcEndpoint<Request extends z.ZodType, Response extends z.ZodType> {
  readonly channel: string;
  readonly request: Request;
  readonly response: Response;
}

export function defineEndpoint<Request extends z.ZodType, Response extends z.ZodType>(
  channel: string,
  request: Request,
  response: Response,
): IpcEndpoint<Request, Response> {
  return { channel, request, response };
}

/** Sends a raw payload over a channel. Provided by the preload (`ipcRenderer.invoke`). */
export type RawInvoke = (channel: string, payload: unknown) => Promise<unknown>;

/** Client side: validates the request before sending and the response after receiving. */
export async function callEndpoint<Request extends z.ZodType, Response extends z.ZodType>(
  invoke: RawInvoke,
  endpoint: IpcEndpoint<Request, Response>,
  request: z.input<Request>,
): Promise<z.output<Response>> {
  const payload = endpoint.request.parse(request);
  const result = await invoke(endpoint.channel, payload);
  return endpoint.response.parse(result);
}

/**
 * Server side: wraps an implementation so that it only ever sees a validated request and can only
 * return a valid response. `context` carries whatever the host needs (for example the sender).
 */
export function createValidatedHandler<
  Request extends z.ZodType,
  Response extends z.ZodType,
  Context,
>(
  endpoint: IpcEndpoint<Request, Response>,
  implementation: (
    request: z.output<Request>,
    context: Context,
  ) => z.input<Response> | Promise<z.input<Response>>,
): (payload: unknown, context: Context) => Promise<z.output<Response>> {
  return async (payload, context) => {
    const request = endpoint.request.parse(payload);
    const result = await implementation(request, context);
    return endpoint.response.parse(result);
  };
}
