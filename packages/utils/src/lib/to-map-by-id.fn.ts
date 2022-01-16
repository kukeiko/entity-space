import { toMap } from "./to-map.fn";

export function toMapById<K, V extends Record<"id", any>>(items: V[]): Map<K, V> {
    return toMap(items, item => item.id);
}
