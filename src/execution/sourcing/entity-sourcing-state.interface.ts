import { EntitySchema, EntitySelection } from "@entity-space/elements";

export interface EntitySourcingState {
    getSchema(): EntitySchema;
    getTargetSelection(): EntitySelection;
    getAvailableSelection(): EntitySelection;
    getOpenSelection(): EntitySelection | undefined;
}
