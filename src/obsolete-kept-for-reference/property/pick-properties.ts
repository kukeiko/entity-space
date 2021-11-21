import { Property } from "./property";
import { isProperty } from "./is-property";

export function pickProperties<T>(type: T, predicate: (p: Property) => boolean = () => true): Record<string, Property> {
    const fields: Record<string, Property> = {};

    for (const k in type) {
        const candidate = type[k];

        if (isProperty(candidate) && predicate(candidate)) {
            fields[k] = candidate;
        }
    }

    return fields;
}
