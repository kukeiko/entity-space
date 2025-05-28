import { isEntityPrimitiveProperty } from "./entity-primitive-property";
import { EntityProperty } from "./entity-property";
import { isEntityRelationProperty } from "./entity-relation-property";

export function isCreatableEntityProperty(property: EntityProperty): boolean {
    if (isEntityRelationProperty(property)) {
        return !property.isReadonly();
    } else if (isEntityPrimitiveProperty(property)) {
        return property.isReadonly() ? property.isCreatable() : true;
    } else {
        return false;
    }
}
