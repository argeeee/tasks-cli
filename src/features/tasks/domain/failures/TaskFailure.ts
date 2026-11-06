export type TaskFailure = {
  type:
    | "CONFIGURATION"
    | "AUTHORIZATION"
    | "PERMISSION"
    | "NOT_FOUND"
    | "VALIDATION"
    | "NETWORK"
    | "UNEXPECTED";
  message: string;
};
