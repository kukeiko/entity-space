import { EntityProperty } from "./entity-property";
import { isCreatableEntityProperty } from "./is-creatable-entity-property.fn";

export function isRequiredCreatableEntityProperty(property: EntityProperty): boolean {
    if (property.isOptional()) {
        return false;
    } else {
        return isCreatableEntityProperty(property);
    }
}
