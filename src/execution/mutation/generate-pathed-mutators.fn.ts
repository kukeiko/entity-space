import { EntitySchema, EntitySelection, selectionToPathedRelatedSchemas } from "@entity-space/elements";
import { toPathSegments } from "@entity-space/utils";
import { EntityServiceContainer } from "../entity-service-container";
import { PathedEntityMutator } from "./pathed-entity-mutator";

export function generatePathedMutators(
    services: EntityServiceContainer,
    schema: EntitySchema,
    selection: EntitySelection,
): PathedEntityMutator[] {
    return selectionToPathedRelatedSchemas(schema, selection)
        .sort(([pathA], [pathB]) => toPathSegments(pathA).length - toPathSegments(pathB).length)
        .flatMap(([path, pathedSchema]) =>
            services.getExplicitMutatorsFor(pathedSchema).map(mutator => new PathedEntityMutator(path, mutator)),
        );
}
