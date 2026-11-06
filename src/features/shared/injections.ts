import { join } from "node:path";
import { lazy } from "../../core/lazy";
import { GoogleAuthorizationService } from "./application/googleAuthorization/GoogleAuthorizationService";
import { GoogleOAuthAuthorizer } from "./application/googleAuthorization/GoogleOAuthAuthorizer";
import { GoogleTokenReader } from "./application/googleAuthorization/GoogleTokenReader";
import { GoogleTokenWriter } from "./application/googleAuthorization/GoogleTokenWriter";
import { GoogleAuthorizationState } from "./application/models/GoogleAuthorizationState";
import { DefaultBrowserOpener } from "./application/services/DefaultBrowserOpener";

const getGoogleAuthorizationState = lazy(
  () => new GoogleAuthorizationState(),
);
const getBrowserOpener = lazy(
  () => new DefaultBrowserOpener(),
);
const getTokenPath = lazy(
  () => join(process.cwd(), ".tasks", "google-oauth-token.json"),
);
const getGoogleTokenReader = lazy(
  () => new GoogleTokenReader(getTokenPath()),
);
const getGoogleTokenWriter = lazy(
  () => new GoogleTokenWriter(getTokenPath()),
);
const getGoogleOAuthAuthorizer = lazy(
  () => new GoogleOAuthAuthorizer(getBrowserOpener()),
);

export const getGoogleAuthorizationService = lazy(
  () =>
    new GoogleAuthorizationService(
      getGoogleAuthorizationState(),
      getGoogleTokenReader(),
      getGoogleTokenWriter(),
      getGoogleOAuthAuthorizer(),
    ),
);
