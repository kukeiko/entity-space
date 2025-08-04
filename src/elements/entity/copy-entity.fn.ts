import { EntitySelection } from "../selection/entity-selection";
import { copyEntities } from "./copy-entities.fn";
import { Entity } from "./entity";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function copyEntity(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntitySelection,
    relatedPredicate?: (relation: EntityRelationProperty, entity: Entity) => boolean,
): Entity {
    return copyEntities(schema, [entity], selection, relatedPredicate)[0];
}
