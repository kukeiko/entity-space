import { EntityProperty } from "./entity-property";

export function isUpdatableEntityProperty(property: EntityProperty): boolean {
    return !property.isReadonly();
}
