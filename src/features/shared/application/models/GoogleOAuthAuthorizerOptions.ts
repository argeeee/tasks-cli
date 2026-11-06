import type { GoogleOAuthCallback } from "./GoogleOAuthCallback";

export type GoogleOAuthAuthorizerOptions = {
  callbackFactory?: () => GoogleOAuthCallback;
};
