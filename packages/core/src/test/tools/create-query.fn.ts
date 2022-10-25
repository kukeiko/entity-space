import { BlueprintInstance, EntitySchemaCatalog, ExpansionValue } from "@entity-space/common";
import { any, matches, MatchesBagArgument } from "@entity-space/criteria";
import { Class } from "@entity-space/utils";
import { Query } from "../../lib/query/query";

export function createQuery<T>(
    schemas: EntitySchemaCatalog,
    blueprint: Class<T>,
    criteria?: MatchesBagArgument<BlueprintInstance<T>>,
    expansion?: ExpansionValue<BlueprintInstance<T>>
): Query {
    return new Query({
        entitySchema: schemas.resolve(blueprint),
        criteria: criteria ? matches(criteria) : any(),
        expansion,
    });
}
