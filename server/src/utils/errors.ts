/**
 * 错误分层（ARCHITECTURE §7.5 错误码表）。
 * 第一层：请求体校验 -> 400 / 1001、1002
 * 第二层：业务规则（限流、蜜罐、采集开关、鉴权）-> 2001 / 2002 / 3001 / 4001
 * 第三层：未捕获异常 -> 500 / 5001，记录日志但不向客户端暴露细节
 */

export const ERROR_CODES = {
  VALIDATION_FAILED: 1001,
  INVALID_SOFTWARE_NAME: 1002,
  RATE_LIMITED: 2001,
  HONEYPOT: 2002,
  COLLECTION_DISABLED: 3001,
  ADMIN_TOKEN_INVALID: 4001,
  INTERNAL: 5001,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** 是否属于"静默成功"语义：HTTP 2xx 但不落库（蜜罐 / 采集关闭）。 */
  readonly silentSuccess: boolean;

  constructor(code: ErrorCode, status: number, message: string, silentSuccess = false) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.silentSuccess = silentSuccess;
  }
}

export function validationError(message: string): AppError {
  return new AppError(ERROR_CODES.VALIDATION_FAILED, 400, message);
}

export function invalidSoftwareNameError(message: string): AppError {
  return new AppError(ERROR_CODES.INVALID_SOFTWARE_NAME, 400, message);
}

export function rateLimitedError(): AppError {
  return new AppError(ERROR_CODES.RATE_LIMITED, 429, '请求过于频繁');
}

export function honeypotError(): AppError {
  return new AppError(ERROR_CODES.HONEYPOT, 200, '', true);
}

export function collectionDisabledError(): AppError {
  return new AppError(ERROR_CODES.COLLECTION_DISABLED, 200, '', true);
}

export function adminTokenError(): AppError {
  return new AppError(ERROR_CODES.ADMIN_TOKEN_INVALID, 401, '管理员令牌无效');
}

export function internalError(): AppError {
  return new AppError(ERROR_CODES.INTERNAL, 500, '服务端内部错误');
}
