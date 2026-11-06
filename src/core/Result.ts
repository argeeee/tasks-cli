export type ResultBase = {
  hasValue: boolean;
};

export type ResultValue<T> = ResultBase & {
  hasValue: true;
  value: T;
};

export type ResultError<E> = ResultBase & {
  hasValue: false;
  error: E;
};

export type Result<T, E> = ResultValue<T> | ResultError<E>;

export function success<T>(value: T): ResultValue<T> {
  return { hasValue: true, value };
}

export function failure<E>(error: E): ResultError<E> {
  return { hasValue: false, error };
}
