import { EntitySchema, EntitySelection } from "@entity-space/elements";
import { AcceptedEntityHydration } from "./accepted-entity-hydration";

export abstract class EntityHydrator {
    abstract accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false;
}
