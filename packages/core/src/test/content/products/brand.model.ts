import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { DataEntryMetadataBlueprint } from "../common/metadata.model";

@EntityBlueprint({ id: "brands" })
export class BrandBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
    rating = define(Number);
    ranking = define(Number);
    metadata = define(DataEntryMetadataBlueprint, { required: true });
}

export type Brand = EntityBlueprintInstance<BrandBlueprint>;
