export interface RepoQuery<Input, Output> {
  query(input: Input): Promise<Output>;
}
