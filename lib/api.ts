import { getErrorInfo } from './minimax/errors';

interface ApiError {
  error: string;
  statusCode?: number;
}

export class ApiRequestError extends Error {
  statusCode?: number;
  action?: string;

  constructor(message: string, statusCode?: number, action?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.action = action;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const statusCode = data.statusCode;
    if (statusCode) {
      if (statusCode === 2061) {
        throw new ApiRequestError(data.rawError || data.error || '当前模型不支持', statusCode);
      }
      const info = getErrorInfo(statusCode);
      throw new ApiRequestError(info.message, statusCode, info.action);
    }
    throw new ApiRequestError(data.error || '请求失败');
  }

  return data as T;
}
