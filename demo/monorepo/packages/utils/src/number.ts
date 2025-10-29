/**
 * 数字工具函数
 */

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isEven(num: number): boolean {
  return num % 2 === 0;
}

export function isOdd(num: number): boolean {
  return num % 2 !== 0;
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}