import { Request } from 'express';

/**
 * 获取真实客户端 IP
 * 处理了反向代理、多 IP、IPv6 格式等情况，并限制长度防止数据库报错
 */
export function getRealIp(req: Request): string {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 处理数组情况 (极少见，但类型定义里有)
  if (Array.isArray(ip)) {
    ip = ip[0];
  }
  // 处理多级代理情况 "client, proxy1, proxy2"
  else if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0];
  }

  const cleanIp = (ip as string)?.trim() || '';
  // 强制截断适应数据库字段 (VARCHAR 50)
  return cleanIp.substring(0, 50);
}

/**
 * 获取 User-Agent
 */
export function getUserAgent(req: Request): string {
  const ua = req.headers['user-agent'];
  return (Array.isArray(ua) ? ua[0] : ua) || '';
}
