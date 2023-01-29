import { BlueprintInstance, EntitySchemaCatalog, UnpackedEntitySelection } from "@entity-space/common";
import { Class } from "@entity-space/utils";
import { any } from "../../lib/criteria/criterion/any/any.fn";
import { matches, MatchesBagArgument } from "../../lib/criteria/criterion/named/matches.fn";
import { EntityQuery } from "../../lib/query/entity-query";

export function createQuery<T>(
    schemas: EntitySchemaCatalog,
    blueprint: Class<T>,
    criteria?: MatchesBagArgument<BlueprintInstance<T>>,
    selection?: UnpackedEntitySelection<BlueprintInstance<T>>
): EntityQuery {
    return new EntityQuery({
        entitySchema: schemas.resolve(blueprint),
        criteria: criteria ? matches(criteria) : any(),
        selection,
    });
}
