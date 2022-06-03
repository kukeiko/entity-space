export function pluck<T, K extends keyof T>(key: K): (item: T) => T[K];
export function pluck<T, K extends keyof T>(key: K, item: T): T[K];
export function pluck<T, K extends keyof T>(key: K, item?: T): any {
    if (item === void 0) {
        return (item: T) => item[key];
    }

    return item[key];
}
