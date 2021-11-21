import { Property } from "./property";
import { isProperty } from "./is-property";

export function findProperty(model: any, predicate: (p: Property) => boolean = () => true): Property | undefined {
    let property: Property | undefined = void 0;

    for (const k in model) {
        const candidate = model[k];

        if (isProperty(candidate) && predicate(candidate)) {
            return candidate;
        }
    }

    return property;
}
