import { EntitySchema } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { AutoJoinEntityHydrator } from "../auto-join-entity-hydrator";
import { EntityHydrator } from "../entity-hydrator";

export function getHydratorsForSchema(services: EntityServiceContainer, schema: EntitySchema): EntityHydrator[] {
    const explicit = services.getExplicitHydratorsFor(schema);

    return [...explicit, new AutoJoinEntityHydrator(services)];
}
