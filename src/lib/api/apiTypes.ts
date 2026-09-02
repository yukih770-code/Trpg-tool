export type ApiErrorPayload = {
  kind: string;
  message: string;
  retryable?: boolean;
  /**
   * Optional machine-readable discriminator for cases where `kind` alone is
   * ambiguous. Additive: existing errors omit it and existing callers ignore it.
   */
  reason?: string;
};

export type ApiSuccess<T> = {
  ok: true;
  statusCode: number;
  value: T;
  requestId?: string;
};

export type ApiFailure = {
  ok: false;
  statusCode: number;
  error: ApiErrorPayload;
  requestId?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiClientErrorKind =
  | 'configuration'
  | 'network'
  | 'non_json'
  | 'api_error'
  | 'invalid_response';

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly statusCode?: number;
  readonly apiErrorKind?: string;
  /** Server-supplied discriminator when `apiErrorKind` alone is ambiguous. */
  readonly apiErrorReason?: string;
  readonly retryable: boolean;

  constructor(
    kind: ApiClientErrorKind,
    message: string,
    options: {
      statusCode?: number;
      apiErrorKind?: string;
      apiErrorReason?: string;
      retryable?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.kind = kind;
    this.statusCode = options.statusCode;
    this.apiErrorKind = options.apiErrorKind;
    this.apiErrorReason = options.apiErrorReason;
    this.retryable = options.retryable === true;
  }
}
