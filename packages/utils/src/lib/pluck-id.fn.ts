export function pluckId<T extends Record<"id", any>>(items: T[]): T["id"][] {
    return items.map(item => item["id"]);
}
