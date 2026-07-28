export function isManuallyRetryableFailure(errorCode: string | null) {
  if (!errorCode) return false;

  if (
    errorCode === "temporary_processing_failure" ||
    errorCode === "github_network_error"
  ) {
    return true;
  }

  return /^(github|slack)_http_(429|5\d\d)$/.test(errorCode);
}
