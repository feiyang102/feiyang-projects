/**
 * 通用工具函数
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
}
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}
export function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string' || Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function retry(fn, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attempt = (currentRetry) => {
            fn()
                .then(resolve)
                .catch(error => {
                if (currentRetry >= retries) {
                    reject(error);
                }
                else {
                    setTimeout(() => attempt(currentRetry + 1), delay);
                }
            });
        };
        attempt(0);
    });
}
//# sourceMappingURL=common.js.map