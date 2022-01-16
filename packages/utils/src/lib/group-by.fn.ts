export function groupBy<T, U, P = T>(items: T[], key: (item: T) => U, project?: (item: T) => P): Map<U, P[]> {
    project = project || ((item: any) => item);
    const map = new Map<U, P[]>();

    for (const item of items) {
        const itemKey = key(item);
        let group = map.get(itemKey);

        if (group === void 0) {
            group = [];
            map.set(itemKey, group);
        }

        group.push(project(item));
    }

    return map;
}
