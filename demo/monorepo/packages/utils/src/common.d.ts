/**
 * 通用工具函数
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare function deepClone<T>(obj: T): T;
export declare function isEmpty(value: any): boolean;
export declare function sleep(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, retries?: number, delay?: number): Promise<T>;
//# sourceMappingURL=common.d.ts.map