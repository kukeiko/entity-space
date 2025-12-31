import { Entity, EntitySelection } from "@entity-space/elements";
import { Path, prependPath, readPath } from "@entity-space/utils";
import { AcceptedEntityHydration, HydrateEntitiesFnInternal } from "./accepted-entity-hydration";

export class PathedAcceptedEntityHydration extends AcceptedEntityHydration {
    constructor(
        path: Path | undefined,
        acceptedSelection: EntitySelection,
        requiredSelection: EntitySelection,
        hydrateFn: HydrateEntitiesFnInternal,
    ) {
        super(
            prependPath(path, acceptedSelection),
            prependPath(path, requiredSelection),
            async ({ entities, selection, context }) => {
                const pathedEntities = readPath<Entity>(path, entities);
                await hydrateFn({
                    entities: pathedEntities,
                    selection: readPath<EntitySelection>(path, selection) ?? {},
                    context,
                });
            },
        );
    }
}
