import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";

export function getSelectedSchemas(schema: EntitySchema, selection: EntitySelection): EntitySchema[] {
    let schemas: EntitySchema[] = [];

    for (const [key, value] of Object.entries(selection)) {
        if (!schema.isRelation(key)) {
            continue;
        }

        const relatedSchema = schema.getRelation(key).getRelatedSchema();

        if (!schemas.find(candidate => candidate.getName() === relatedSchema.getName())) {
            schemas.push(relatedSchema);
        }

        if (value !== true && value !== selection) {
            schemas = [...schemas, ...getSelectedSchemas(relatedSchema, value)];
        }
    }

    return schemas;
}
