const INTERNAL_ORIGIN = "https://internal.repopilot.invalid";

export function getSafeInternalPath(
  requestedPath: string | null | undefined,
  fallbackPath = "/dashboard",
): string {
  if (!requestedPath?.startsWith("/")) {
    return fallbackPath;
  }

  try {
    const parsedUrl = new URL(requestedPath, INTERNAL_ORIGIN);

    if (parsedUrl.origin !== INTERNAL_ORIGIN) {
      return fallbackPath;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallbackPath;
  }
}
