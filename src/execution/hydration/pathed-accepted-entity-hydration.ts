import { Entity, EntitySelection } from "@entity-space/elements";
import { Path, prependPath, readPath } from "@entity-space/utils";
import { AcceptedEntityHydration, HydrateEntitiesFunction } from "./accepted-entity-hydration";

export class PathedAcceptedEntityHydration extends AcceptedEntityHydration {
    constructor(
        path: Path | undefined,
        acceptedSelection: EntitySelection,
        requiredSelection: EntitySelection,
        hydrateFn: HydrateEntitiesFunction,
    ) {
        super(
            prependPath(path, acceptedSelection),
            prependPath(path, requiredSelection),
            async (entities, selection, context) => {
                const pathedEntities = readPath<Entity>(path, entities);
                await hydrateFn(pathedEntities, readPath<EntitySelection>(path, selection) ?? {}, context);
            },
        );
    }
}
