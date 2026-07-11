export class NetworkError extends Error {
  constructor(message: string, opts?: { cause?: unknown }) {
    super(message, opts);
    this.name = "NetworkError";
  }
}

export function isFetchNetworkFailure(e: unknown): boolean {
  // If no network connection, there is an error that looks sth like "TypeError: Failed to fetch",
  // depending on the browser.

  if (!(e instanceof TypeError)) {
    return false;
  }

  const msg = e.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed")
  );
}
