export function subtractSets<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
    const copy = new Set(a);

    a.forEach(value => {
        if (b.has(value)) {
            copy.delete(value);
        }
    });

    return copy;
}
