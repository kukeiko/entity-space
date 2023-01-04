import { BlueprintInstance, EntitySchemaCatalog, UnfoldedEntitySelection } from "@entity-space/common";
import { any, matches, MatchesBagArgument } from "@entity-space/criteria";
import { Class } from "@entity-space/utils";
import { EntityQuery } from "../../lib/query/entity-query";

export function createQuery<T>(
    schemas: EntitySchemaCatalog,
    blueprint: Class<T>,
    criteria?: MatchesBagArgument<BlueprintInstance<T>>,
    selection?: UnfoldedEntitySelection<BlueprintInstance<T>>
): EntityQuery {
    return new EntityQuery({
        entitySchema: schemas.resolve(blueprint),
        criteria: criteria ? matches(criteria) : any(),
        selection,
    });
}
