import { Class } from "@entity-space/utils";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../lib/criteria/vnext/entity-criteria-tools";
import { EntityWhere } from "../../lib/criteria/vnext/entity-criteria-tools.interface";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { BlueprintInstance } from "../../lib/schema/blueprint-instance";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

export function createQuery<T>(
    schemas: EntitySchemaCatalog,
    blueprint: Class<T>,
    criteria?: EntityWhere<BlueprintInstance<T>>,
    selection?: UnpackedEntitySelection<BlueprintInstance<T>>
): IEntityQuery {
    const criteriaFactory = new EntityCriteriaTools();
    return new EntityQueryTools({ criteriaTools: criteriaFactory }).createQuery({
        entitySchema: schemas.resolve(blueprint),
        criteria: criteria ? criteriaFactory.where(criteria) : criteriaFactory.all(),
        selection,
    });
}
