/**
 * 字符串工具函数
 */
export function capitalize(str) {
    if (!str)
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function truncate(str, length, suffix = '...') {
    if (str.length <= length)
        return str;
    return str.slice(0, length) + suffix;
}
export function camelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}
export function kebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
export function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
//# sourceMappingURL=string.js.map