export interface ErrorInfo {
  message: string;
  action?: string;
}

const ERROR_MAP: Record<number, ErrorInfo> = {
  0: { message: '请求成功' },
  1000: { message: '系统错误，请稍后再试' },
  1001: { message: '请求超时，请稍后再试' },
  1002: { message: '请求频率超限', action: '请稍后再试，或减少请求频率' },
  1004: { message: '账号鉴权失败', action: '请检查 API Key 是否正确' },
  1008: { message: '账号余额不足', action: '请前往 MiniMax 平台充值' },
  1024: { message: '内部服务错误，请稍后再试' },
  1026: { message: '输入内容涉敏', action: '请修改输入内容后重试' },
  1027: { message: '输出内容涉敏', action: '请修改输入内容后重试' },
  1033: { message: '系统错误，请稍后再试' },
  1039: { message: 'Token 限制', action: '请缩短输入内容' },
  1041: { message: '连接数限制', action: '请联系 MiniMax 官方' },
  1042: { message: '输入包含不可见字符或非法字符', action: '请检查输入内容' },
  1045: { message: '请求频率增长超限', action: '请避免请求骤增骤减' },
  2013: { message: '参数错误', action: '请检查输入参数' },
  2049: { message: '无效的 API Key', action: '请在设置中重新配置 API Key' },
  2056: { message: '超出资源限制', action: '请等待一段时间后重试' },
  2061: { message: '当前模型不支持该参数组合', action: '请切换模型或调整参数' },
};

export function getErrorInfo(statusCode: number): ErrorInfo {
  return ERROR_MAP[statusCode] || { message: `未知错误 (code: ${statusCode})` };
}

export function getErrorMessage(statusCode: number): string {
  const info = getErrorInfo(statusCode);
  return info.action ? `${info.message}，${info.action}` : info.message;
}
