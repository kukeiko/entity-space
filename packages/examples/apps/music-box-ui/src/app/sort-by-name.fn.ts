export function sortByName<T extends { name: string }>(items: T[]): T[] {
    return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}