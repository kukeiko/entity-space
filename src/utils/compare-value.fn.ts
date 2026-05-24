export function compareValue(a: unknown, b: unknown): number {
    if (a === b || (a == null && b == null)) {
        return 0;
    } else if (a == null || b == null) {
        return a == null ? 1 : -1;
    } else if (typeof a !== typeof b) {
        throw new Error("trying to sort between incompatible data types");
    } else if (typeof a === "number") {
        return a - (b as number);
    } else if (typeof a === "boolean") {
        return a === true ? -1 : 1;
    } else if (typeof a === "string") {
        return a.localeCompare(b as string);
    } else {
        return 0;
    }
}
