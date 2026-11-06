import type { GoogleAuthorizationService } from "../../../shared/application/googleAuthorization/GoogleAuthorizationService";

export type GoogleAuthorizationProvider = Pick<
  GoogleAuthorizationService,
  "getAuthorizedClient"
>;
