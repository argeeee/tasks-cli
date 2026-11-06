export type GoogleFailure = {
  type: "CONFIGURATION" | "AUTHORIZATION" | "NETWORK" | "UNEXPECTED";
  message: string;
};
