/**
 * A short description of an error that is safe to write to the log. drizzle's query errors put
 * the query parameters (amounts, notes) into their message (node_modules/drizzle-orm/errors.js),
 * and the log of a release build can be read over adb, so only the error's name and the
 * database's own reason are kept.
 */
export function describeError(e: unknown): string {
  if (!(e instanceof Error)) return typeof e;
  const cause = e.cause instanceof Error ? `: ${e.cause.message}` : "";
  return `${e.name}${cause}`;
}
