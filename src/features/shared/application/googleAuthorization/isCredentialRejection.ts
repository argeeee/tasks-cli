type OAuthErrorResponse = {
  data?: unknown;
};

type OAuthRefreshError = {
  response?: OAuthErrorResponse;
};

type OAuthErrorBody = {
  error?: unknown;
};

const INVALID_GRANT = "invalid_grant";

export function isCredentialRejection(error: unknown): boolean {
  if (error instanceof Error && /^invalid_grant\b/.test(error.message)) {
    return true;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const data = (error as OAuthRefreshError).response?.data;
  if (typeof data !== "object" || data === null) {
    return false;
  }

  return (data as OAuthErrorBody).error === INVALID_GRANT;
}
