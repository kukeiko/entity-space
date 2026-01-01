import { EntitySchema, EntitySelection, selectionToPathedRelatedSchemas } from "@entity-space/elements";
import { toPathSegments } from "@entity-space/utils";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityHydrator } from "../entity-hydrator";
import { PathedEntityHydrator } from "../pathed-entity-hydrator";
import { getHydratorsForSchema } from "./get-hydrators-for-schema.fn";

export function getHydratorsForSelection(
    services: EntityServiceContainer,
    schema: EntitySchema,
    selection: EntitySelection,
): EntityHydrator[] {
    return selectionToPathedRelatedSchemas(schema, selection)
        .sort(([pathA], [pathB]) => toPathSegments(pathA).length - toPathSegments(pathB).length)
        .flatMap(([path, pathedSchema]) =>
            getHydratorsForSchema(services, pathedSchema).map(
                hydrator => new PathedEntityHydrator(hydrator, schema, path, pathedSchema),
            ),
        );
}
