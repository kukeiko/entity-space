import { UserBlueprint } from "./user.model";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { define } from "../../../lib/schema/entity-blueprint-property";

/**
 * Example of a model that has data that exists on a lot of types, but is put into a separate model to reduce repetitiveness.
 * As such, it doesn't have an id, and can not exist without the model that references it.
 *
 * It has references to other models, so this showcases how you can have navigations to addressable models within a complex type model.
 *
 * The only way to load this would be to include it in the selection of the respective model query (e.g. when loading TreeNodes,
 * include "metadata" in the selection).
 *
 * Once loaded, and when loaded without "createdBy" or "updatedBy", it can still be hydrated without loading the model it is referenced by,
 * as all we need to load those two properties is the ids of the users, which we have.
 */
@EntityBlueprint({ id: "data-entry-metadata" })
export class DataEntryMetadataBlueprint {
    createdAt = define(String, { readOnly: true });
    createdById = define(Number, { readOnly: true, index: true });
    createdBy = define(UserBlueprint, {
        optional: true,
        readOnly: true,
        relation: true,
        from: "createdById",
        to: "id",
    });
    updatedAt = define(String, { nullable: true, readOnly: true });
    updatedById = define(Number, { nullable: true, readOnly: true, index: true });
    updatedBy = define(UserBlueprint, {
        optional: true,
        nullable: true,
        readOnly: true,
        relation: true,
        from: "updatedById",
        to: "id",
    });
}

export type DataEntryMetadata = EntityBlueprintInstance<DataEntryMetadataBlueprint>;
