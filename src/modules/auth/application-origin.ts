type ApplicationOriginOptions = {
  canonicalUrl: string;
  vercelEnvironment?: string;
  vercelUrl?: string;
};

export function getApplicationOrigin({
  canonicalUrl,
  vercelEnvironment,
  vercelUrl,
}: ApplicationOriginOptions) {
  if (vercelEnvironment !== "preview" || !vercelUrl) {
    return new URL(canonicalUrl).origin;
  }

  try {
    const previewUrl = new URL(`https://${vercelUrl}`);

    if (
      previewUrl.protocol === "https:" &&
      previewUrl.hostname.endsWith(".vercel.app")
    ) {
      return previewUrl.origin;
    }
  } catch {
    // Fall back to the explicitly configured canonical URL.
  }

  return new URL(canonicalUrl).origin;
}
