import { EntitySelection } from "../selection/entity-selection";
import { copyEntities } from "./copy-entities.fn";
import { Entity } from "./entity";
import { EntityProperty } from "./entity-property";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function copyEntity(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntitySelection,
    relatedPredicate?: (relation: EntityRelationProperty, entity: Entity) => boolean,
    propertyPredicate?: (property: EntityProperty, entity: Entity) => boolean,
): Entity {
    return copyEntities(schema, [entity], selection, relatedPredicate, propertyPredicate)[0];
}
