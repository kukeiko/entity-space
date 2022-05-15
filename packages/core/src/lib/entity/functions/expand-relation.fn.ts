import { ExpansionObject } from "../../expansion/public";
import { Query } from "../../query/query";
import { IEntitySchemaRelation } from "../../schema/public";
import { Entity } from "../entity";
import { IEntitySource } from "../entity-source.interface";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";
import { joinEntities } from "./join-entities.fn";

export async function expandRelation(
    entities: Entity[],
    relation: IEntitySchemaRelation,
    source: IEntitySource,
    expansion?: ExpansionObject
): Promise<false | ExpansionObject> {
    const relatedSchema = relation.getRelatedEntitySchema();
    // [todo] what about dictionaries?
    const isArray = relation.getProperty().getValueSchema().schemaType === "array";
    const fromIndex = relation.getFromIndex();
    const toIndex = relation.getToIndex();
    const criteria = createCriterionFromEntities(entities, fromIndex.getPath(), toIndex.getPath());
    const query = new Query(relatedSchema, criteria, expansion ?? {});
    const result = await source.query(query);

    if (result === false) {
        return false;
    }

    // [todo] fix
    const queried = result[0];

    joinEntities(
        entities,
        queried.getEntities(),
        relation.getPropertyName(),
        fromIndex.getPath(),
        toIndex.getPath(),
        isArray
    );

    return queried.getQuery().getExpansionObject();
}
