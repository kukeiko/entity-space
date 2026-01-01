import { EntitySchema, EntitySelection } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityHydrator } from "../entity-hydrator";
import { RecursiveAutoJoinEntityHydrator } from "../recursive-auto-join-entity-hydrator";
import { RecursiveEntityHydrator } from "../recursive-entity-hydrator";
import { getHydratorsForSchema } from "./get-hydrators-for-schema.fn";
import { getHydratorsForSelection } from "./get-hydrators-for-selection.fn";

export function getHydrators(
    services: EntityServiceContainer,
    schema: EntitySchema,
    selection: EntitySelection,
): EntityHydrator[] {
    return [
        new RecursiveAutoJoinEntityHydrator(services),
        new RecursiveEntityHydrator(services),
        ...getHydratorsForSchema(services, schema),
        ...getHydratorsForSelection(services, schema, selection),
    ];
}
