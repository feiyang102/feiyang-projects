/**
 * 数字工具函数
 */
export function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
}
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function isEven(num) {
    return num % 2 === 0;
}
export function isOdd(num) {
    return num % 2 !== 0;
}
export function percentage(value, total) {
    if (total === 0)
        return 0;
    return (value / total) * 100;
}
//# sourceMappingURL=number.js.map