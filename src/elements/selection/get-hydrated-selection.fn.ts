import { Entity } from "../entity/entity";
import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";

function getHydratedSelectionCore(schema: EntitySchema, hydratedSelection: EntitySelection, entities: Entity[]): void {
    const optionalPrimitiveProperties = schema
        .getProperties()
        .filter(isEntityPrimitiveProperty)
        .filter(property => property.isOptional());

    for (const property of optionalPrimitiveProperties) {
        if (entities.some(entity => entity[property.getName()]) === undefined) {
            hydratedSelection[property.getName()] = true;
        }
    }

    const relations = schema.getProperties().filter(isEntityRelationProperty);

    for (const relation of relations) {
        if (relation.isOptional() && entities.some(entity => entity[relation.getName()] === undefined)) {
            continue;
        }

        const relatedEntities = relation.readValues(entities);

        if (!relatedEntities.length) {
            continue;
        }

        const relatedSchema = relation.getRelatedSchema();
        const relatedHydratedSelection = (hydratedSelection[relation.getName()] = getDefaultSelection(relatedSchema));
        getHydratedSelectionCore(relatedSchema, relatedHydratedSelection, relatedEntities);
    }
}

export function getHydratedSelection(schema: EntitySchema, entities: Entity[]): EntitySelection {
    if (!entities.length) {
        return {};
    }

    const hydratedSelection = getDefaultSelection(schema);
    getHydratedSelectionCore(schema, hydratedSelection, entities);

    return hydratedSelection;
}
