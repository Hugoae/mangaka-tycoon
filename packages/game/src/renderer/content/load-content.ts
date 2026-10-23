import { CONTENT_FILE_NAMES, loadGameContent } from "@mangaka/content";
import type { ContentFile, LoadResult } from "@mangaka/content";

/** Where the build copies the content files, next to the page (see `electron.vite.config.ts`). */
export const CONTENT_BASE_URL = "/base/";

type Fetcher = (url: string) => Promise<Pick<Response, "ok" | "status" | "text">>;

async function readContentFile(
  fetcher: Fetcher,
  baseUrl: string,
  name: string,
): Promise<ContentFile | string> {
  const url = `${baseUrl}${name}`;
  try {
    const response = await fetcher(url);
    if (!response.ok) {
      return `${name}: could not be read (HTTP ${String(response.status)}).`;
    }
    return { name, text: await response.text() };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return `${name}: could not be read (${reason}).`;
  }
}

/**
 * Reads the content files over HTTP (the `app://` protocol in production, the Vite server in
 * development) and validates them. Never throws: the result says what is wrong, so the UI can show it.
 */
export async function loadContent(
  baseUrl: string = CONTENT_BASE_URL,
  fetcher: Fetcher = (url) => fetch(url),
): Promise<LoadResult> {
  const read = await Promise.all(
    CONTENT_FILE_NAMES.map((name) => readContentFile(fetcher, baseUrl, name)),
  );

  const files: ContentFile[] = [];
  const errors: string[] = [];
  for (const entry of read) {
    if (typeof entry === "string") {
      errors.push(entry);
    } else {
      files.push(entry);
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return loadGameContent(files);
}
