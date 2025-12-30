import {
    EntityBlueprint,
    EntitySchema,
    EntitySelection,
    PackedEntitySelection,
    SelectEntity,
} from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { AcceptedEntityHydration } from "./accepted-entity-hydration";

export type HydrateEntitiesFn<B, S = {}, P = {}> = (
    entities: SelectEntity<EntityBlueprint.Instance<B>, S>[],
    selection: PackedEntitySelection<EntityBlueprint.Instance<B>>,
    context: EntityQueryExecutionContext,
    parameters: EntityBlueprint.Instance<P>
) => void | Promise<void>;

export abstract class EntityHydrator {
    abstract expand(schema: EntitySchema, openSelection: EntitySelection): false | EntitySelection;

    abstract accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
        parametersSchema?: EntitySchema,
    ): AcceptedEntityHydration | false;
}
