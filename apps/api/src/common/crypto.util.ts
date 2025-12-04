import { createHash, randomInt } from 'node:crypto';

export function md5(text: string) {
  return createHash('md5').update(text).digest('hex');
}

export function sha256(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

export function gen6Code() {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}
