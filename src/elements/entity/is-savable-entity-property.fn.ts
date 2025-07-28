import { EntityProperty } from "./entity-property";
import { isCreatableEntityProperty } from "./is-creatable-entity-property.fn";
import { isUpdatableEntityProperty } from "./is-updatable-entity-property.fn";

export function isSavableEntityProperty(property: EntityProperty): boolean {
    return isCreatableEntityProperty(property) || isUpdatableEntityProperty(property);
}
