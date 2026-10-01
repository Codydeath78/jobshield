import { createHash } from "node:crypto";

export function normalizeThreatUrl(
  rawUrl: string,
): string | null {
  try {
    const url =
      new URL(
        rawUrl.trim(),
      );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    /* Fragments are never sent to the HTTP server and should not affect reputation. */
    url.hash = "";

    /*
     * WHAT WE INTENTIONALLY DO NOT DO:
     *
     * - lowercase paths
     * - reorder query parameters
     * - remove query parameters
     * - decode arbitrary percent encoding
     *
     * Those can change URL semantics.
     */

    return url.toString();
  } catch {
    return null;
  }
}

export function hashThreatUrl(
  normalizedUrl: string,
): string {
  return createHash("sha256")
    .update(normalizedUrl)
    .digest("hex");
}

export function hostnameFromUrl(
  normalizedUrl: string,
): string | null {
  try {
    return new URL(
      normalizedUrl,
    ).hostname.toLowerCase();
  } catch {
    return null;
  }
}