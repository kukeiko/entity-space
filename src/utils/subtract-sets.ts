// [todo] typo
export function subtractSets<T>(a: Set<T>, b: Set<T>): Set<T> {
    const copy = new Set(a);

    a.forEach(value => {
        if (b.has(value)) {
            copy.delete(value);
        }
    });

    return copy;
}
