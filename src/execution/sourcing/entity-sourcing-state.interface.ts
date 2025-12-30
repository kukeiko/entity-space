import { EntitySchema, EntitySelection } from "@entity-space/elements";

export interface EntitySourcingState {
    getSchema(): EntitySchema;
    getParametersSchema(): EntitySchema | undefined;
    getTargetSelection(): EntitySelection;
    getAvailableSelection(): EntitySelection;
    getOpenSelection(): EntitySelection | undefined;
}
