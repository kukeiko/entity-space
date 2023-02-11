import { Entity } from "../../common/entity.type";
import { EntityCriteriaFactory } from "../../criteria/vnext/entity-criteria-factory";
import { EntityQueryFactory } from "../../query/entity-query-factory";
import { IEntityQuery } from "../../query/entity-query.interface";
import { IEntitySchema } from "../../schema/schema.interface";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export function createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery {
    const indexCriteria = createCriterionFromEntities(entities, schema.getKey().getPath());
    return new EntityQueryFactory({ criteriaFactory: new EntityCriteriaFactory() }).createQuery({
        entitySchema: schema,
        criteria: indexCriteria,
    });
}
