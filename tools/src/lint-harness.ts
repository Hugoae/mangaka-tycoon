import { resolve } from "node:path";

import { ESLint } from "eslint";

export const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

/** A snippet linted as if it lived at `file`; nothing is written to disk. */
export interface ProbeCase {
  readonly name: string;
  readonly file: string;
  readonly code: string;
  /** For "must fail" cases the rule that must report; for "must pass" cases the rule that must stay silent. */
  readonly ruleId: string;
}

/**
 * Builds a linter on the real `eslint.config.js`. The probe files do not exist on disk, so
 * typescript-eslint must treat them as "default project" files.
 */
export function createProbeLinter(probeFiles: readonly string[]): ESLint {
  return new ESLint({
    cwd: REPOSITORY_ROOT,
    overrideConfig: {
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: [...probeFiles],
            defaultProject: "tsconfig.base.json",
            maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 20,
          },
          tsconfigRootDir: REPOSITORY_ROOT,
        },
      },
    },
  });
}

/** Rule ids reported for a snippet. Throws on parsing/configuration errors, which have no rule id. */
export async function reportedRules(
  eslint: ESLint,
  file: string,
  code: string,
): Promise<readonly string[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(REPOSITORY_ROOT, file) });
  if (result === undefined) {
    throw new Error(`ESLint returned no result for ${file}`);
  }
  // A fatal error would make a "must fail" case pass for the wrong reason.
  const fatal = result.messages.filter((message) => message.fatal === true);
  if (fatal.length > 0) {
    throw new Error(`Fatal ESLint errors for ${file}: ${JSON.stringify(fatal)}`);
  }
  return result.messages.flatMap((message) => (message.ruleId === null ? [] : [message.ruleId]));
}
