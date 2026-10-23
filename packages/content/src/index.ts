/**
 * Public API of `@mangaka/content`: validates the game's data files and builds the content the core
 * reads. It never touches the disk: the host reads the files and passes their text in (ADR 0002).
 */
export { CONTENT_FILE_NAMES, loadGameContent } from "./loader";
export type { ContentFile, ContentFileName, LoadResult } from "./loader";
