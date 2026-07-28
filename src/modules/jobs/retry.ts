const RETRY_DELAYS_SECONDS = [30, 120, 600, 1800] as const;

export function nextRetryAt(attemptCount: number, now = new Date()) {
  const delaySeconds =
    RETRY_DELAYS_SECONDS[
      Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_SECONDS.length - 1)
    ];

  return new Date(now.getTime() + delaySeconds * 1000);
}

export function shouldRetry(attemptCount: number, maxAttempts: number) {
  return attemptCount < maxAttempts;
}
