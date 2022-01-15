export function buildDefaultIndexName(path: string | string[]): string {
    return Array.isArray(path) ? path.join(",") : path;
}
